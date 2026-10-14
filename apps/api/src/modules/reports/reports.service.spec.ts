import { describe, it, beforeEach } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(() => {
    service = new ReportsService();
  });

  it('debe estar definido', () => {
    ok(service);
  });

  it('debe calcular las metricas institucionales con exactitud', () => {
    const metrics = service.getMetrics();
    strictEqual(metrics.totalGraduates, 90);
    strictEqual(metrics.verifiedGraduates, 72);
    strictEqual(metrics.observedGraduates, 18);
    // Valida que ningún observado compute como mentor activo
    const mentoresVerificadosReales = service['records'].filter(
      (r) => r.estado === 'VERIFICADO' && r.deseaMentor
    ).length;
    strictEqual(metrics.activeMentors, mentoresVerificadosReales);
    strictEqual(metrics.activeMentors, 37);
  });

  it('debe paginar el padron de egresados correctamente', () => {
    const res = service.getGraduates({ page: '1', limit: '5' });
    strictEqual(res.data.length, 5);
    strictEqual(res.meta.total, 90);
    strictEqual(res.meta.totalPages, 18);
    strictEqual(res.meta.page, 1);
  });

  it('debe filtrar por estado OBSERVADO', () => {
    const res = service.getGraduates({ status: 'OBSERVADO', limit: '30' });
    strictEqual(res.data.length, 18);
    ok(res.data.every((r) => r.estado === 'OBSERVADO'));
  });

  it('debe filtrar por termino de busqueda', () => {
    const res = service.getGraduates({ search: 'Morales' });
    ok(res.data.length >= 1);
    strictEqual(res.data[0].apellido, 'Morales Albarracín');
  });
});