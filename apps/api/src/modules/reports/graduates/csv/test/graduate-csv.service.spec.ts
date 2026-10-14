import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { MockGraduateReportDataSource } from '../data/mock-graduate-report-data-source.service';
import { GraduateCsvController } from '../graduate-csv.controller';
import { GraduateCsvService } from '../graduate-csv.service';
import { GraduateCsvRecord } from '../types/graduate-csv-record.type';

function createRecord(
  overrides: Partial<GraduateCsvRecord> = {},
): GraduateCsvRecord {
  return {
    numero: 1,
    numeroRegistro: '#REG-2024-0001',
    nombreCompleto: 'Ana Muñoz Pérez',
    codigoSis: '202012345',
    telefono: '70707070',
    correoElectronico: 'ana.munoz@example.com',
    fechaIngreso: '01/02/2020',
    fechaTitulacion: '20/03/2025',
    duracionEstudio: '5 años',
    fechaRevision: '01/10/2026',
    motivoRechazo: '',
    estado: 'VERIFICADO',
    ...overrides,
  };
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function createResponse(headers: Record<string, string>) {
  return {
    setHeader(name: string, value: string): void {
      headers[name] = value;
    },
  };
}

test('genera un CSV con BOM UTF-8 y las mismas 12 columnas de la tabla web', () => {
  const service = new GraduateCsvService();
  const generationDate = new Date(2026, 9, 1, 12, 0, 0);

  const { buffer, filename } = service.generate(
    [createRecord()],
    generationDate,
    'VERIFICADO',
  );

  assert.deepEqual(Array.from(buffer.subarray(0, 3)), [0xef, 0xbb, 0xbf]);
  assert.equal(filename, 'nomina-egresados-verificados-01102026.csv');

  const content = buffer.toString('utf8');
  assert.ok(content.startsWith('\uFEFF'));

  const [header] = content.slice(1).split('\r\n');
  assert.equal(header.split(',').length, 12);
  assert.equal(
    header,
    'Nro,Número de registro,Nombre completo,Código SIS,Teléfono,Correo electrónico,Fecha de ingreso,Fecha de titulación,Duración de estudio,Fecha de revisión,Motivo de rechazo,Estado',
  );
  assert.ok(content.includes('#REG-2024-0001'));
  assert.ok(content.includes('Ana Muñoz Pérez'));
  assert.ok(content.includes('VERIFICADO'));
  assert.ok(content.endsWith('\r\n'));
});

test('genera nombre de archivo acorde al estado observado', () => {
  const service = new GraduateCsvService();
  const generationDate = new Date(2026, 9, 1, 12, 0, 0);

  const { filename } = service.generate(
    [createRecord({ estado: 'OBSERVADO' })],
    generationDate,
    'OBSERVADO',
  );

  assert.equal(filename, 'nomina-egresados-observados-01102026.csv');
});

test('escapa comas, comillas y saltos de línea sin perder caracteres especiales', () => {
  const service = new GraduateCsvService();
  const record = createRecord({
    nombreCompleto: 'Muñoz, Ana "Ñusta"\nSegunda línea',
    motivoRechazo: 'Documento, con "observación"\nsegunda línea',
  });

  const { buffer } = service.generate(
    [record],
    new Date(2026, 9, 1),
    'VERIFICADO',
  );
  const content = buffer.toString('utf8');

  assert.ok(content.includes('"Muñoz, Ana ""Ñusta""\nSegunda línea"'));
  assert.ok(
    content.includes('"Documento, con ""observación""\nsegunda línea"'),
  );
  assert.ok(content.includes('Ñusta'));
});

test('rechaza una exportación vacía con mensaje acorde al estado', () => {
  const service = new GraduateCsvService();

  assert.throws(
    () => service.generate([], new Date(), 'VERIFICADO'),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, 'No hay egresados verificados para exportar');
      return true;
    },
  );

  assert.throws(
    () => service.generate([], new Date(), 'OBSERVADO'),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, 'No hay egresados observados para exportar');
      return true;
    },
  );
});

test('devuelve el mensaje esperado cuando ocurre un error de generación', () => {
  const service = new GraduateCsvService();
  const record = createRecord();

  Object.defineProperty(record, 'nombreCompleto', {
    get() {
      throw new Error('error simulado');
    },
  });

  assert.throws(
    () => service.generate([record], new Date(), 'VERIFICADO'),
    (error: unknown) => {
      assert.ok(error instanceof InternalServerErrorException);
      assert.equal(
        error.message,
        'No se pudo generar el archivo CSV. Intente nuevamente.',
      );
      return true;
    },
  );
});

test('usa el mock consolidado de HU1/HU2/HU3', () => {
  const dataSource = new MockGraduateReportDataSource();
  const verified = dataSource.findAll({ status: 'VERIFICADO' });
  const observed = dataSource.findAll({ status: 'OBSERVADO' });
  const all = dataSource.findAll({});

  assert.equal(verified.length, 72);
  assert.equal(observed.length, 18);
  assert.equal(all.length, 90);
  assert.equal(verified.length + observed.length, all.length);
});

test('aplica la misma búsqueda visible por nombre o código SIS', () => {
  const dataSource = new MockGraduateReportDataSource();

  const byName = dataSource.findAll({
    status: 'OBSERVADO',
    search: 'quispe',
  });
  const bySis = dataSource.findAll({
    status: 'OBSERVADO',
    search: '201709122',
  });

  assert.equal(byName.length, 1);
  assert.equal(byName[0].nombreCompleto, 'Quispe Condori, Marcelo Andrés');
  assert.ok(byName[0].motivoRechazo.length > 0);
  assert.equal(bySis.length, 1);
  assert.equal(bySis[0].codigoSis, '201709122');
});

test('el endpoint CSV exporta solo los observados seleccionados', async () => {
  const dataSource = new MockGraduateReportDataSource();
  const service = new GraduateCsvService();
  const controller = new GraduateCsvController(dataSource, service);
  const headers: Record<string, string> = {};

  const file = controller.exportCsv(
    'OBSERVADO',
    undefined,
    undefined,
    createResponse(headers),
  );

  const buffer = await streamToBuffer(file.getStream());
  const content = buffer.toString('utf8').slice(1).trimEnd();
  const lines = content.split('\r\n');

  assert.equal(lines.length, 19);
  assert.ok(content.includes(',OBSERVADO'));
  assert.ok(!content.includes(',VERIFICADO'));
  assert.equal(headers['Content-Type'], 'text/csv; charset=utf-8');
  assert.match(
    headers['Content-Disposition'],
    /^attachment; filename="nomina-egresados-observados-\d{8}\.csv"$/,
  );
});

test('el endpoint CSV exporta los verificados cuando ese estado está activo', async () => {
  const dataSource = new MockGraduateReportDataSource();
  const service = new GraduateCsvService();
  const controller = new GraduateCsvController(dataSource, service);
  const headers: Record<string, string> = {};

  const file = controller.exportCsv(
    'VERIFICADO',
    undefined,
    undefined,
    createResponse(headers),
  );

  const buffer = await streamToBuffer(file.getStream());
  const content = buffer.toString('utf8').slice(1).trimEnd();
  const lines = content.split('\r\n');

  assert.equal(lines.length, 73);
  assert.ok(content.includes(',VERIFICADO'));
  assert.ok(!content.includes(',OBSERVADO'));
  assert.match(
    headers['Content-Disposition'],
    /^attachment; filename="nomina-egresados-verificados-\d{8}\.csv"$/,
  );
});

test('el endpoint CSV con TODOS exporta exactamente todos los registros del mock', async () => {
  const dataSource = new MockGraduateReportDataSource();
  const service = new GraduateCsvService();
  const controller = new GraduateCsvController(dataSource, service);
  const headers: Record<string, string> = {};

  const file = controller.exportCsv(
    'TODOS',
    undefined,
    undefined,
    createResponse(headers),
  );

  const buffer = await streamToBuffer(file.getStream());
  const content = buffer.toString('utf8').slice(1).trimEnd();
  const lines = content.split('\r\n');

  assert.equal(lines.length, 91);
  assert.ok(content.includes(',VERIFICADO'));
  assert.ok(content.includes(',OBSERVADO'));
  assert.match(
    headers['Content-Disposition'],
    /^attachment; filename="nomina-egresados-\d{8}\.csv"$/,
  );
});

test('rechaza un estado de exportación desconocido', () => {
  const dataSource = new MockGraduateReportDataSource();
  const service = new GraduateCsvService();
  const controller = new GraduateCsvController(dataSource, service);

  assert.throws(
    () =>
      controller.exportCsv(
        'APROBADO',
        undefined,
        undefined,
        createResponse({}),
      ),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, 'Estado de exportación inválido');
      return true;
    },
  );
});