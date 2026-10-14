import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { GraduatesReportRepository } from './graduates-report.repository';

describe('GraduatesReportRepository: origen de los datos', () => {
  let previousUseMock: string | undefined;
  let previousSupabaseUrl: string | undefined;

  beforeEach(() => {
    previousUseMock = process.env.GRADUATES_REPORT_USE_MOCK;
    previousSupabaseUrl = process.env.SUPABASE_URL;
    delete process.env.GRADUATES_REPORT_USE_MOCK;
    delete process.env.SUPABASE_URL;
  });

  afterEach(() => {
    if (previousUseMock === undefined) delete process.env.GRADUATES_REPORT_USE_MOCK;
    else process.env.GRADUATES_REPORT_USE_MOCK = previousUseMock;
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
  });

  it('sin Supabase configurado usa los datos de prueba', () => {
    assert.equal(new GraduatesReportRepository().isUsingMock(), true);
  });

  it('con Supabase configurado sigue usando los datos de prueba por defecto', () => {
    process.env.SUPABASE_URL = 'https://ejemplo.supabase.co';

    assert.equal(new GraduatesReportRepository().isUsingMock(), true);
  });

  it('lee la base de datos sólo con GRADUATES_REPORT_USE_MOCK=false y Supabase configurado', () => {
    process.env.SUPABASE_URL = 'https://ejemplo.supabase.co';
    process.env.GRADUATES_REPORT_USE_MOCK = 'false';

    assert.equal(new GraduatesReportRepository().isUsingMock(), false);
  });

  it('con GRADUATES_REPORT_USE_MOCK=false pero sin Supabase, usa los datos de prueba', () => {
    process.env.GRADUATES_REPORT_USE_MOCK = 'false';

    assert.equal(new GraduatesReportRepository().isUsingMock(), true);
  });

  it('con Supabase configurado responde el reporte sin pedir la carrera del administrador', async () => {
    process.env.SUPABASE_URL = 'https://ejemplo.supabase.co';

    const source = await new GraduatesReportRepository().findApplicationsByStatus('verificado');

    assert.equal(source.carrera.nombre, 'Ingeniería de Sistemas');
    assert.equal(source.solicitudes.length, 72);
  });
});
