import { applicationReviewSummary, assertObservationLimit } from './application-review-summary';
import { PrismaApplicationsRepository } from './prisma-applications.repository';
jest.mock('../../../../shared/infrastructure/database/prisma.service', () => ({ PrismaService: class {} }));

function setup(observations: number) {
  return {
    dictamen: { count: jest.fn().mockResolvedValue(observations),
      findFirst: jest.fn().mockResolvedValue({ justificacion: 'Documento ilegible' }), create: jest.fn() },
    $queryRaw: jest.fn().mockResolvedValue([{ total: 4 }]),
    solicitud: { findFirst: jest.fn().mockResolvedValue({ estado: 'PENDIENTE' }), update: jest.fn() },
  };
}

describe('T-11.3 reglas e historial de revisión', () => {
  it.each([0, 1])('permite observar con %i observaciones previas', async (count) => {
    await expect(assertObservationLimit(setup(count) as never, 'id')).resolves.toBeUndefined();
  });
  it.each([2, 3])('rechaza otra observación con %i previas', async (count) => {
    await expect(assertObservationLimit(setup(count) as never, 'id'))
      .rejects.toMatchObject({ code: 'OBSERVATION_LIMIT_REACHED' });
  });
  it('devuelve contadores, límite y la última nota completa', async () => {
    const tx = setup(2);
    expect(await applicationReviewSummary(tx as never, 'id')).toEqual({ observations: 2,
      maxObservations: 2, rejections: 4, maxRejections: 5, canObserve: false,
      latestObservation: 'Documento ilegible' });
    expect(tx.dictamen.count).toHaveBeenCalledWith({ where: {
      id_solicitud: 'id', decision: { in: ['OBSERVADA', 'OBSERVED', 'OBSERVADO'] },
    } });
  });
  it('bloquea una petición directa bajo el bloqueo transaccional, sin emitir dictamen', async () => {
    const tx = setup(2);
    const prisma = { $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) };
    const repo = new PrismaApplicationsRepository(prisma as never);
    const actor = { id: 'admin', scopes: { careerIds: [] } };
    await expect(repo.review(actor as never, 'id', { decision: 'OBSERVADA', category: 'Documento',
      note: 'Corregir documento' }, null, 'encrypted', {} as never))
      .rejects.toMatchObject({ code: 'OBSERVATION_LIMIT_REACHED' });
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.dictamen.create).not.toHaveBeenCalled();
    expect(tx.solicitud.update).not.toHaveBeenCalled();
  });
});
