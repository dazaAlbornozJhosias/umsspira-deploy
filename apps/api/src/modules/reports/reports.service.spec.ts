import { ValidationPipe } from '@nestjs/common';
import { describe, it, beforeEach } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { GetGraduatesQueryDto } from './dto/get-graduates-query.dto';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(() => {
    service = new ReportsService();
  });

  it('debe estar definido', () => {
    ok(service);
  });

  it('debe calcular las metricas institucionales con exactitud', async () => {
    const metrics = await service.getMetrics();
    strictEqual(metrics.totalGraduates, 90);
    strictEqual(metrics.verifiedGraduates, 72);
    strictEqual(metrics.observedGraduates, 18);
    const mentoresVerificadosReales = service['mockRecords'].filter(
      (r) => r.estado === 'VERIFICADO' && r.deseaMentor,
    ).length;
    strictEqual(metrics.activeMentors, mentoresVerificadosReales);
    strictEqual(metrics.activeMentors, 37);
  });

  it('debe paginar el padron de egresados correctamente', async () => {
    const res = await service.getGraduates({ page: '1', limit: '5' });
    strictEqual(res.data.length, 5);
    strictEqual(res.meta.total, 90);
    strictEqual(res.meta.totalPages, 18);
    strictEqual(res.meta.page, 1);
  });

  it('debe conservar page, limit, search y status con el whitelist global', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });

    const query = (await pipe.transform(
      {
        page: '1',
        limit: '1000',
        search: 'quispe',
        status: 'VERIFICADO',
      },
      {
        type: 'query',
        metatype: GetGraduatesQueryDto,
        data: undefined,
      },
    )) as GetGraduatesQueryDto;

    strictEqual(query.page, '1');
    strictEqual(query.limit, '1000');
    strictEqual(query.search, 'quispe');
    strictEqual(query.status, 'VERIFICADO');
  });

  it('debe filtrar por estado OBSERVADO', async () => {
    const res = await service.getGraduates({ status: 'OBSERVADO', limit: '30' });
    strictEqual(res.data.length, 18);
    ok(res.data.every((r) => r.estado === 'OBSERVADO'));
  });

  it('debe filtrar por termino de busqueda', async () => {
    const res = await service.getGraduates({ search: 'Morales' });
    ok(res.data.length >= 1);
    strictEqual(res.data[0].apellido, 'Morales Albarracín');
  });
});