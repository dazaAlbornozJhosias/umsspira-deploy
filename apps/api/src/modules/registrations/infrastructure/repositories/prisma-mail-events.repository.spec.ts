import type { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { PrismaMailEventsRepository } from './prisma-mail-events.repository';

describe('Reproceso de correos fallidos', () => {
  const tx = {
    correoTramite: { findMany: jest.fn(), update: jest.fn() },
    correoPendiente: { updateMany: jest.fn() },
  };
  const prisma = { $transaction: jest.fn((run: (client: typeof tx) => unknown) => run(tx)) };
  const actor = { scopes: { careerIds: ['carrera-1'] } } as unknown as ActorContext;
  let repository: PrismaMailEventsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PrismaMailEventsRepository(prisma as unknown as PrismaService);
  });

  it('reprograma los correos fallidos con contenido vigente y reinicia sus intentos', async () => {
    tx.correoTramite.findMany.mockResolvedValue([{ id: 'seg-1', clave_evento: 'outbox:cola-1' }]);
    tx.correoPendiente.updateMany.mockResolvedValue({ count: 1 });
    await expect(repository.requeueFailed(actor)).resolves.toEqual({ requeued: 1, expired: 0 });
    expect(tx.correoPendiente.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'cola-1', enviado_en: null }),
        data: { proximo_en: expect.any(Date), intentos: 0 },
      }),
    );
    expect(tx.correoTramite.update).toHaveBeenCalledWith({
      where: { id: 'seg-1' },
      data: expect.objectContaining({ estado: 'pendiente', intentos: 0 }),
    });
  });

  it('cuenta como vencidos los correos cuyo contenido ya no existe', async () => {
    tx.correoTramite.findMany.mockResolvedValue([{ id: 'seg-1', clave_evento: 'outbox:cola-1' }]);
    tx.correoPendiente.updateMany.mockResolvedValue({ count: 0 });
    await expect(repository.requeueFailed(actor)).resolves.toEqual({ requeued: 0, expired: 1 });
    expect(tx.correoTramite.update).not.toHaveBeenCalled();
  });

  it('solo considera los correos fallidos del alcance del actor', async () => {
    tx.correoTramite.findMany.mockResolvedValue([]);
    await repository.requeueFailed(actor);
    expect(tx.correoTramite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          estado: 'fallida',
          solicitud: {
            is: { detalle_solicitud: { is: { id_carrera: { in: ['carrera-1'] } } } },
          },
        }),
      }),
    );
  });

  it('rechaza el reintento individual de un correo que no está fallido a su cargo', async () => {
    tx.correoTramite.findMany.mockResolvedValue([]);
    await expect(repository.requeueFailed(actor, 'seg-9')).rejects.toMatchObject({
      code: 'MAIL_EVENT_NOT_FOUND',
    });
  });
});