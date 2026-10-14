import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { GraduatesReportRepository } from './graduates-report.repository';
import { GraduatesReportService } from './graduates-report.service';
import { ApplicationRow, ReportSourceData } from './types/report-source.types';

const SISTEMAS = { id: 'b1f4c7a2-3d5e-4f6a-8b9c-0d1e2f3a4b5c', nombre: 'Ingeniería de Sistemas' };
const INFORMATICA_ID = 'c2a5d8b3-4e6f-4a7b-9c8d-1e2f3a4b5c6d';

function application(
  apellido: string,
  estado: string,
  fechaDictamen: string,
  idCarrera: string = SISTEMAS.id,
): ApplicationRow {
  return {
    estado,
    detalle_solicitud: {
      nombre: 'Ana',
      apellido,
      cod_sis: 201503367,
      telefono: '+591 76409285',
      email: 'ana@est.umss.edu.bo',
      fecha_ingreso: '2015-02-09',
      fecha_titulacion: '2022-12-05',
      id_carrera: idCarrera,
    },
    dictamen: { fecha_creacion: fechaDictamen },
  };
}

// Repositorio falso: devuelve siempre las mismas filas, sin base de datos
function fakeRepository(solicitudes: ApplicationRow[], usingMock = true): GraduatesReportRepository {
  return {
    isUsingMock: () => usingMock,
    findApplicationsByStatus: async (): Promise<ReportSourceData> => ({ carrera: SISTEMAS, solicitudes }),
  } as unknown as GraduatesReportRepository;
}

describe('GraduatesReportService', () => {
  it('con la base de datos ordena los titulados por fecha y apellido, con los 9 datos', async () => {
    const service = new GraduatesReportService(
      fakeRepository(
        [
          application('Vargas', 'verificado', '2026-09-12'),
          application('Arnez', 'verificado', '2026-09-12'),
          application('López', 'verificado', '2026-09-10'),
        ],
        false,
      ),
    );

    const report = await service.getGraduatesReport('verified', SISTEMAS.id);

    assert.equal(report.careerName, 'Ingeniería de Sistemas');
    assert.equal(report.status, 'verified');
    assert.equal(report.total, 3);
    assert.deepEqual(
      report.graduates.map((row) => row.fullName),
      ['López, Ana', 'Arnez, Ana', 'Vargas, Ana'],
    );
    assert.deepEqual(report.graduates[0], {
      number: 1,
      fullName: 'López, Ana',
      sisCode: '201503367',
      phone: '+591 76409285',
      email: 'ana@est.umss.edu.bo',
      admissionDate: '09/02/2015',
      graduationDate: '05/12/2022',
      careerDuration: '7 años, 9 meses',
      statusDate: '10/09/2026',
    });
  });

  it('no mezcla otros estados ni otras carreras', async () => {
    const service = new GraduatesReportService(
      fakeRepository([
        application('Rojas', 'observado', '2026-09-08'),
        application('Choque', 'observado', '2026-09-09', INFORMATICA_ID),
        application('Paz', 'verificado', '2026-09-09'),
      ]),
    );

    const report = await service.getGraduatesReport('observed', SISTEMAS.id);

    assert.equal(report.total, 1);
    assert.equal(report.graduates[0].fullName, 'Rojas, Ana');
  });

  it('lee la fecha del dictamen también cuando Supabase la devuelve como lista', async () => {
    const row = application('Mamani', 'verificado', '2026-09-15');
    const service = new GraduatesReportService(
      fakeRepository([{ ...row, dictamen: [{ fecha_creacion: '2026-09-15' }] as unknown as ApplicationRow['dictamen'] }]),
    );

    const report = await service.getGraduatesReport('verified', SISTEMAS.id);

    assert.equal(report.graduates[0].statusDate, '15/09/2026');
  });

  it('sin titulados responde 404 con el mensaje de QA', async () => {
    const service = new GraduatesReportService(fakeRepository([]));

    await assert.rejects(service.getGraduatesReport('observed', SISTEMAS.id), (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, 'No hay titulados observados para exportar');
      return true;
    });
  });

  it('con la base de datos real exige la carrera del administrador', async () => {
    const service = new GraduatesReportService(fakeRepository([], false));

    await assert.rejects(service.getGraduatesReport('verified'), BadRequestException);
  });
});

describe('GraduatesReportService con los datos de prueba', () => {
  let previousUseMock: string | undefined;

  beforeEach(() => {
    previousUseMock = process.env.GRADUATES_REPORT_USE_MOCK;
    process.env.GRADUATES_REPORT_USE_MOCK = 'true';
  });

  afterEach(() => {
    if (previousUseMock === undefined) delete process.env.GRADUATES_REPORT_USE_MOCK;
    else process.env.GRADUATES_REPORT_USE_MOCK = previousUseMock;
  });

  it('sin carrera usa Ingeniería de Sistemas: 72 verificados y 18 observados', async () => {
    const service = new GraduatesReportService(new GraduatesReportRepository());

    const verified = await service.getGraduatesReport('verified');
    const observed = await service.getGraduatesReport('observed');

    assert.equal(verified.careerName, 'Ingeniería de Sistemas');
    assert.equal(verified.total, 72);
    assert.equal(observed.total, 18);
  });

  it('empieza con los titulados de la tabla de /reports, en el mismo orden y con los mismos datos', async () => {
    const service = new GraduatesReportService(new GraduatesReportRepository());

    const verified = await service.getGraduatesReport('verified');
    const observed = await service.getGraduatesReport('observed');

    // Los 7 verificados y los 4 observados de la tabla de la HU1-HU3 van primero
    assert.deepEqual(
      verified.graduates.slice(0, 7).map((row) => row.sisCode),
      ['201804921', '201901844', '201708301', '201903490', '201704612', '201809003', '201901842'],
    );
    assert.deepEqual(
      observed.graduates.slice(0, 4).map((row) => row.sisCode),
      ['201709122', '201805510', '201802119', '201907723'],
    );
    assert.deepEqual(verified.graduates[0], {
      number: 1,
      fullName: 'Morales Albarracín, Valeria Sofía',
      sisCode: '201804921',
      phone: '+591 79519163',
      email: 'valeria.morales@postgrado.uc.edu',
      admissionDate: '12/02/2018',
      graduationDate: '24/10/2024',
      careerDuration: '6 años 8 meses',
      statusDate: '25/11/2025',
    });
  });

  it('sin el texto de la tabla, calcula la duración con las fechas', async () => {
    const row = application('Vargas', 'verificado', '2026-09-12');
    const service = new GraduatesReportService(fakeRepository([row]));

    const report = await service.getGraduatesReport('verified', SISTEMAS.id);

    assert.equal(report.graduates[0].careerDuration, '7 años, 9 meses');
  });

  it('con la carrera de Informática trae sólo sus 10 verificados', async () => {
    const service = new GraduatesReportService(new GraduatesReportRepository());

    const report = await service.getGraduatesReport('verified', INFORMATICA_ID);

    assert.equal(report.careerName, 'Ingeniería Informática');
    assert.equal(report.total, 10);
  });
});
