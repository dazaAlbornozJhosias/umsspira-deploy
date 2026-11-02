import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ApplicationQuery } from '../../application/contracts/registration-inputs';
import { PrismaApplicationsRepository } from './prisma-applications.repository';
 
// El repositorio solo usa PrismaService como tipo del constructor; se evita cargar el cliente generado.
jest.mock('../../../../shared/infrastructure/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
 
const actor = { id: 'actor-1', scopes: { careerIds: ['carrera-1'] } } as unknown as ActorContext;
 
const query = (overrides: Partial<ApplicationQuery> = {}) =>
  ({ page: 1, pageSize: 10, ...overrides }) as ApplicationQuery;
 
const rows = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    estado: prefix === 'pendiente' ? 'PENDIENTE' : 'APROBADA',
    fecha_creacion: new Date('2026-10-01T10:00:00Z'),
  }));
 
interface Setup {
  pending: number;
  others: number;
  pendingRows?: unknown[];
  otherRows?: unknown[];
}
 
function createRepository({ pending, others, pendingRows = [], otherRows = [] }: Setup) {
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'solicitud-coincidente' }]),
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    solicitud: {
      // Primero se cuenta el total y luego los pendientes, como en el repositorio.
      count: jest.fn().mockResolvedValueOnce(pending + others).mockResolvedValueOnce(pending),
      findMany: jest.fn(({ where }: { where: { AND: Array<{ estado: unknown }> } }) =>
        Promise.resolve(where.AND[1].estado === 'PENDIENTE' ? pendingRows : otherRows),
      ),
    },
  };
  return { prisma, repository: new PrismaApplicationsRepository(prisma as never) };
}

function createMetricsRepository(counts: [number, number, number], resolved: unknown[]) {
  const prisma = {
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    solicitud: {
      count: jest
        .fn()
        .mockResolvedValueOnce(counts[0])
        .mockResolvedValueOnce(counts[1])
        .mockResolvedValueOnce(counts[2]),
    },
    dictamen: { findMany: jest.fn().mockResolvedValue(resolved) },
  };
  return { prisma, repository: new PrismaApplicationsRepository(prisma as never) };
}
 
describe('PrismaApplicationsRepository.list', () => {
  describe('filtro por periodo (CA-08.4)', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-21T15:00:00Z'));
    });
 
    afterEach(() => {
      jest.useRealTimers();
    });
 
    it('filtra por fecha de registro con el día de Bolivia en «Últimos 15 días»', async () => {
      const { prisma, repository } = createRepository({ pending: 0, others: 0 });
 
      await repository.list(actor, query({ period: 'last15' }));
 
      const { where } = prisma.solicitud.count.mock.calls[0][0];
      expect(where.AND).toContainEqual({
        fecha_creacion: {
          gte: new Date('2026-10-07T04:00:00.000Z'),
          lt: new Date('2026-10-22T04:00:00.000Z'),
        },
      });
    });
 
    it('«Desde/Hasta» incluye el día final completo', async () => {
      const { prisma, repository } = createRepository({ pending: 0, others: 0 });
 
      await repository.list(actor, query({ period: 'custom', from: '2026-10-01', to: '2026-10-15' }));
 
      const { where } = prisma.solicitud.count.mock.calls[0][0];
      expect(where.AND).toContainEqual({
        fecha_creacion: {
          gte: new Date('2026-10-01T04:00:00.000Z'),
          lt: new Date('2026-10-16T04:00:00.000Z'),
        },
      });
    });
 
    it('sin periodo no agrega ninguna condición de fecha', async () => {
      const { prisma, repository } = createRepository({ pending: 0, others: 0 });
 
      await repository.list(actor, query());
 
      expect(JSON.stringify(prisma.solicitud.count.mock.calls[0][0])).not.toContain('fecha_creacion');
    });
  });
  

  it('primera página: pendientes más antiguos primero y con el id como desempate (CA-08.2)', async () => {
    const { prisma, repository } = createRepository({
      pending: 25,
      others: 10,
      pendingRows: rows(10, 'pendiente'),
    });
 
    const page = await repository.list(actor, query({ page: 1, pageSize: 10 }));
 
    expect(prisma.solicitud.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.solicitud.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ fecha_creacion: 'asc' }, { id: 'asc' }],
        skip: 0,
        take: 10,
      }),
    );
    expect(page.items).toHaveLength(10);
    expect(page.total).toBe(35);
    expect(page.totalPages).toBe(4);
  });
 
  it('una página que cruza de pendientes a dictaminadas no repite ni omite expedientes (CA-08.2)', async () => {
    const { prisma, repository } = createRepository({
      pending: 25,
      others: 10,
      pendingRows: rows(5, 'pendiente'),
      otherRows: rows(5, 'dictaminada'),
    });
 
    const page = await repository.list(actor, query({ page: 3, pageSize: 10 }));
 
    const [pendingCall, otherCall] = prisma.solicitud.findMany.mock.calls.map(([args]) => args);
    expect(pendingCall).toMatchObject({ skip: 20, take: 10 });
    expect(otherCall).toMatchObject({
      orderBy: [{ fecha_creacion: 'desc' }, { id: 'asc' }],
      skip: 0,
      take: 5,
    });
    expect(page.items).toHaveLength(10);
  });
 
  it('una página posterior a los pendientes solo consulta las dictaminadas con el desplazamiento correcto', async () => {
    const { prisma, repository } = createRepository({
      pending: 25,
      others: 20,
      otherRows: rows(10, 'dictaminada'),
    });
 
    await repository.list(actor, query({ page: 4, pageSize: 10 }));
 
    expect(prisma.solicitud.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.solicitud.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 5, take: 10 }));
  });
 
  it('sin resultados devuelve una sola página vacía (CA-08.6)', async () => {
    const { repository } = createRepository({ pending: 0, others: 0 });
 
    const page = await repository.list(actor, query({ search: 'nadie' }));
 
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.totalPages).toBe(1);
  });
 
  it('limita la consulta a las carreras del actor', async () => {
    const { prisma, repository } = createRepository({ pending: 0, others: 0 });
 
    await repository.list(actor, query());
 
    const { where } = prisma.solicitud.count.mock.calls[0][0];
    expect(where.AND[0]).toEqual({ detalle_solicitud: { is: { id_carrera: { in: ['carrera-1'] } } } });
  });
 
  it('combina carrera, estado y resultados SQL sin perder el alcance del administrador', async () => {
    const { prisma, repository } = createRepository({ pending: 0, others: 0 });

    await repository.list(
      actor,
      query({ career: 'sistemas', status: 'PENDIENTE', search: 'rojas' }),
    );

    const { where } = prisma.solicitud.count.mock.calls[0][0];

    expect(where.AND).toEqual(
      expect.arrayContaining([
        { detalle_solicitud: { is: { id_carrera: { in: ['carrera-1'] } } } },
        { id: { in: ['solicitud-coincidente'] } },
        { estado: 'PENDIENTE' },
        {
          detalle_solicitud: {
            is: {
              AND: [
                {
                  carrera: {
                    is: {
                      nombre: { contains: 'sistemas', mode: 'insensitive' },
                    },
                  },
                },
              ],
            },
          },
        },
      ]),
    );
  });

  it('emplea unaccent y lower en nombre y apellido con valores parametrizados', async () => {
    const { prisma, repository } = createRepository({ pending: 0, others: 0 });

    await repository.list(actor, query({ search: 'Jose Garcia' }));

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);

    const statement = prisma.$queryRaw.mock.calls[0][0];

    expect(statement.sql).toContain("extensions.unaccent(lower(coalesce(d.nombre, '')))");
    expect(statement.sql).toContain("extensions.unaccent(lower(coalesce(d.apellido, '')))");
    expect(statement.sql).toContain('LIKE extensions.unaccent(lower(');
    expect(statement.sql).toContain(' AND ');
    expect(statement.values).toEqual(
      expect.arrayContaining(['%Jose%', '%Garcia%']),
    );
    expect(statement.sql).not.toContain('Jose');
  });

  it('permite nombres en orden invertido y espacios dobles', async () => {
    const { prisma, repository } = createRepository({ pending: 0, others: 0 });

    await repository.list(actor, query({ search: 'Garcia  Jose' }));

    const statement = prisma.$queryRaw.mock.calls[0][0];

    expect(statement.values).toEqual(
      expect.arrayContaining(['%Garcia%', '%Jose%']),
    );
    expect(statement.values.indexOf('%Garcia%')).toBeLessThan(
      statement.values.indexOf('%Jose%'),
    );
  });

  it('mantiene coincidencia parcial por CI y SIS exacto solo con 6 a 9 digitos', async () => {
    const withSis = createRepository({ pending: 0, others: 0 });

    await withSis.repository.list(actor, query({ search: '201804921' }));

    const exact = withSis.prisma.$queryRaw.mock.calls[0][0];

    expect(exact.sql).toContain('d.cod_sis =');
    expect(exact.values).toContain(201804921);

    const withoutSis = createRepository({ pending: 0, others: 0 });

    await withoutSis.repository.list(actor, query({ search: '68492' }));

    const partial = withoutSis.prisma.$queryRaw.mock.calls[0][0];

    expect(partial.sql).not.toContain('d.cod_sis =');
    expect(partial.sql).toContain("coalesce(d.ci, '') LIKE");
    expect(partial.values).toContain('%68492%');
  });

  it('escapa los comodines de LIKE para tratar el texto como literal', async () => {
    const { prisma, repository } = createRepository({ pending: 0, others: 0 });

    await repository.list(actor, query({ search: 'Ana_%' }));

    const statement = prisma.$queryRaw.mock.calls[0][0];

    expect(statement.values).toContain('%Ana!_!%%');
  });

  it('no ejecuta SQL sin texto de busqueda', async () => {
    const { prisma, repository } = createRepository({ pending: 0, others: 0 });

    await repository.list(actor, query({ search: '  ' }));

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
 
describe('PrismaApplicationsRepository.metrics', () => {
  const NOW = new Date('2026-10-21T15:00:00Z');
 
  it('calcula las cuatro cifras con el día de Bolivia (CA-08.1)', async () => {
    const { prisma, repository } = createMetricsRepository([5, 12, 3], [{ id_solicitud: 'a' }, { id_solicitud: 'b' }]);
 
    const metrics = await repository.metrics(actor, NOW);
 
    expect(metrics).toEqual({
      receivedToday: 5,
      pending: 12,
      urgent: 3,
      resolvedToday: 2,
      generatedAt: '2026-10-21T15:00:00.000Z',
      timeZone: 'America/La_Paz',
    });
 
    const [received, pending, urgent] = prisma.solicitud.count.mock.calls.map(([args]) => args.where.AND);
    const todayRange = {
      gte: new Date('2026-10-21T04:00:00.000Z'),
      lt: new Date('2026-10-22T04:00:00.000Z'),
    };
    expect(received[1]).toEqual({ fecha_creacion: todayRange });
    expect(pending[1]).toEqual({ estado: 'PENDIENTE' });
    expect(urgent[1]).toEqual({ estado: 'PENDIENTE', fecha_creacion: { lt: new Date('2026-10-19T15:00:00.000Z') } });
    expect(prisma.dictamen.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ distinct: ['id_solicitud'], where: expect.objectContaining({ fecha_creacion: todayRange }) }),
    );
  });
 
  it('a las 22:00 en Bolivia «hoy» sigue siendo el mismo día', async () => {
    const { prisma, repository } = createMetricsRepository([0, 0, 0], []);
 
    await repository.metrics(actor, new Date('2026-10-22T02:00:00Z'));
 
    const [received] = prisma.solicitud.count.mock.calls.map(([args]) => args.where.AND);
    expect(received[1]).toEqual({
      fecha_creacion: {
        gte: new Date('2026-10-21T04:00:00.000Z'),
        lt: new Date('2026-10-22T04:00:00.000Z'),
      },
    });
  });
 
  it('cuenta solo las solicitudes de las carreras del actor', async () => {
    const { prisma, repository } = createMetricsRepository([0, 0, 0], []);
 
    await repository.metrics(actor, NOW);
 
    const scope = { detalle_solicitud: { is: { id_carrera: { in: ['carrera-1'] } } } };
    for (const [args] of prisma.solicitud.count.mock.calls) {
      expect(args.where.AND[0]).toEqual(scope);
    }
    expect(prisma.dictamen.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ solicitud: { is: scope } }) }),
    );
  });
 
  it('cuenta cada solicitud resuelta una sola vez aunque tenga varios dictámenes el mismo día', async () => {
    const { prisma, repository } = createMetricsRepository([0, 0, 0], [{ id_solicitud: 'a' }]);
 
    const metrics = await repository.metrics(actor, NOW);
 
    expect(metrics.resolvedToday).toBe(1);
    expect(prisma.dictamen.findMany).toHaveBeenCalledWith(expect.objectContaining({ distinct: ['id_solicitud'] }));
  });
});



describe('HU11 - Autoría del dictamen', () => {
  const actor = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Administrador Prueba',
    email: 'admin@ejemplo.com',
    role: 'administrador',
    scopes: { careerIds: [], companyIds: [], graduateId: null },
    permissions: ['solicitudes:review'],
    credentialVersion: 1,
  } as const;

  const solicitudId =
    '22222222-2222-4222-8222-222222222222';

  const dictamenId =
    '33333333-3333-4333-8333-333333333333';

  it('guarda la autoría desde la sesión autenticada', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      solicitud: {
        findFirst: jest.fn().mockResolvedValue({
          estado: 'PENDIENTE',
          id_documento_respaldo: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      dictamen: {
        create: jest.fn().mockResolvedValue({
          id: dictamenId,
        }),
      },
      auditoriaDictamen: {
        create: jest.fn().mockResolvedValue({}),
      },
      correoPendiente: {
        create: jest.fn().mockResolvedValue({}),
      },
      correoTramite: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    const repository = new PrismaApplicationsRepository(
      prisma as never,
    );

    const result = await repository.review(
      actor as never,
      solicitudId,
      { decision: 'APROBADA' },
      'activation-hash',
      'encrypted-mail',
      {
        type: 'aprobacion',
        to: 'titulado@ejemplo.com',
        subject: 'Solicitud aprobada',
      },
    );

    expect(tx.dictamen.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          revisor_id: actor.id,
        }),
      }),
    );

    expect(tx.auditoriaDictamen.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id_dictamen: dictamenId,
          accion: 'emision',
          detalle: expect.objectContaining({
            revisorId: actor.id,
            revisorNombre: actor.name,
            revisorCorreo: actor.email,
          }),
        }),
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        reviewedBy: actor.id,
        reviewedByName: actor.name,
        reviewedByEmail: actor.email,
      }),
    );
  });

  it('rechaza un segundo dictamen', async () => {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      solicitud: {
        findFirst: jest.fn().mockResolvedValue({
          estado: 'APROBADA',
          id_documento_respaldo: null,
        }),
      },
      dictamen: {
        create: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    const repository = new PrismaApplicationsRepository(
      prisma as never,
    );

    const reviewPromise = repository.review(
      actor as never,
      solicitudId,
      { decision: 'RECHAZADA' },
      null,
      'encrypted-mail',
      {
      type: 'rechazo',
      to: 'titulado@ejemplo.com',
      subject: 'Solicitud rechazada',
      },
    );

    await expect(reviewPromise).rejects.toMatchObject({
    code: 'APPLICATION_ALREADY_REVIEWED',
    reason: 'conflict',
    });

    await expect(reviewPromise).rejects.toThrow(
    'Esta solicitud ya fue revisada',
    );

    expect(tx.dictamen.create).not.toHaveBeenCalled();

    });
});
