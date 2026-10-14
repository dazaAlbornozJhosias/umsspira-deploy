import { BadRequestException, InternalServerErrorException, NotFoundException, ValidationPipe } from '@nestjs/common';
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GraduatesReportQueryDto } from './dto/graduates-report-query.dto';
import { GraduatesReportController } from './graduates-report.controller';
import { GraduatesReportService } from './graduates-report.service';
import { GraduatesReportResponse, GraduateStatus } from './types/graduates-report.types';

const REPORT: GraduatesReportResponse = {
  careerName: 'Ingeniería de Sistemas',
  status: 'verified',
  total: 1,
  generatedAt: '2026-10-01T14:00:00.000Z',
  graduates: [
    {
      number: 1,
      fullName: 'López Arnez, Miguel Ángel',
      sisCode: '201503367',
      phone: '+591 76409285',
      email: 'miguel.lopez@est.umss.edu.bo',
      admissionDate: '09/02/2015',
      graduationDate: '05/12/2022',
      careerDuration: '7 años, 9 meses',
      statusDate: '10/09/2026',
    },
  ],
};

// Servicio falso: devuelve el reporte indicado o lanza el error indicado
function controllerWith(result: GraduatesReportResponse | Error): GraduatesReportController {
  const service = {
    getGraduatesReport: async () => {
      if (result instanceof Error) throw result;
      return result;
    },
  } as unknown as GraduatesReportService;
  return new GraduatesReportController(service);
}

function query(status: GraduateStatus): GraduatesReportQueryDto {
  return Object.assign(new GraduatesReportQueryDto(), { status });
}

describe('GraduatesReportController', () => {
  it('GET /graduates-report devuelve el reporte del servicio', async () => {
    const report = await controllerWith(REPORT).getGraduatesReport(query('verified'));

    assert.equal(report.total, 1);
    assert.equal(report.graduates[0].fullName, 'López Arnez, Miguel Ángel');
  });

  it('GET /graduates-report/pdf devuelve un PDF con el nombre del archivo', async () => {
    const file = await controllerWith(REPORT).getGraduatesReportPdf(query('verified'));
    const headers = file.getHeaders();

    assert.equal(headers.type, 'application/pdf');
    assert.equal(headers.disposition, 'inline; filename="reporte-titulados-verificados-20261001.pdf"');

    const chunks: Buffer[] = [];
    for await (const chunk of file.getStream()) chunks.push(Buffer.from(chunk));
    assert.equal(Buffer.concat(chunks).subarray(0, 5).toString(), '%PDF-');
  });

  it('sin titulados deja pasar el 404 del servicio', async () => {
    const controller = controllerWith(new NotFoundException('No hay titulados observados para exportar'));

    await assert.rejects(controller.getGraduatesReportPdf(query('observed')), NotFoundException);
  });

  it('si falla el armado del PDF responde 500 con el mensaje de QA', async () => {
    const broken = { ...REPORT, graduates: null } as unknown as GraduatesReportResponse;

    await assert.rejects(controllerWith(broken).getGraduatesReportPdf(query('verified')), (error: unknown) => {
      assert.ok(error instanceof InternalServerErrorException);
      assert.equal(error.message, 'No se pudo generar el reporte PDF. Intente nuevamente.');
      return true;
    });
  });
});

describe('Validación de parámetros', () => {
  const pipe = new ValidationPipe({ transform: true });
  const metadata = { type: 'query' as const, metatype: GraduatesReportQueryDto };

  it('acepta verified y observed', async () => {
    const value = await pipe.transform({ status: 'observed' }, metadata);

    assert.equal(value.status, 'observed');
  });

  it('rechaza otro estado con 400', async () => {
    await assert.rejects(pipe.transform({ status: 'todos' }, metadata), (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.deepEqual((error.getResponse() as { message: string[] }).message, [
        'El estado debe ser verified u observed',
      ]);
      return true;
    });
  });

  it('rechaza un careerId que no es UUID con 400', async () => {
    await assert.rejects(pipe.transform({ status: 'verified', careerId: '123' }, metadata), BadRequestException);
  });
});
