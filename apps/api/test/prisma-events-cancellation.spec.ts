import { PrismaEventsRepository } from '../src/modules/events/infrastructure/repositories/prisma-events.repository';

describe('PrismaEventsRepository.cancelPublished', () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const eventId = '22222222-2222-4222-8222-222222222222';

  const publishedRow = {
    id: eventId,
    id_usuario: ownerId,
    titulo: 'Feria profesional',
    descripcion: 'Evento de prueba',
    fecha_inicio: new Date('2027-01-01T10:00:00Z'),
    fecha_fin: new Date('2027-01-01T18:00:00Z'),
    fecha_creacion: new Date('2026-10-20T10:00:00Z'),
    cupo_maximo: 100,
    ubicacion: 'Cochabamba',
    id_portada: null,
    estado: 'PUBLICADO',
    archivado: false,
    usuario: { nombre: 'Administración' },
  };

  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    evento: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    paseQr: {
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  };

  const prisma = {
    $transaction: jest.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
  };

  const repository = new PrismaEventsRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    tx.evento.findFirst.mockResolvedValue({ ...publishedRow });
    tx.evento.update.mockResolvedValue({
      ...publishedRow,
      estado: 'CANCELADO',
    });
    tx.paseQr.updateMany.mockResolvedValue({ count: 2 });
  });

  it('cancela el evento e invalida los pases QR vigentes', async () => {
    const result = await repository.cancelPublished(ownerId, eventId);

    expect(result.status).toBe('CANCELADO');

    expect(tx.evento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: eventId,
          id_usuario: ownerId,
          estado: 'PUBLICADO',
          archivado: false,
        },
        data: { estado: 'CANCELADO' },
      }),
    );

    expect(tx.paseQr.updateMany).toHaveBeenCalledWith({
      where: {
        estado: 'VIGENTE',
        inscripcion: { is: { id_evento: eventId } },
      },
      data: { estado: 'INVALIDADO' },
    });

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rechaza la cancelación si el evento no está publicado', async () => {
    tx.evento.findFirst.mockResolvedValue({
      ...publishedRow,
      estado: 'BORRADOR',
    });

    await expect(repository.cancelPublished(ownerId, eventId)).rejects.toThrow(
      'El evento debe estar PUBLICADO',
    );

    expect(tx.evento.update).not.toHaveBeenCalled();
    expect(tx.paseQr.updateMany).not.toHaveBeenCalled();
  });

  it('rechaza el evento si no pertenece al usuario', async () => {
    tx.evento.findFirst.mockResolvedValue(null);

    await expect(repository.cancelPublished(ownerId, eventId)).rejects.toThrow(
      'No se encontró el evento solicitado',
    );

    expect(tx.evento.update).not.toHaveBeenCalled();
    expect(tx.paseQr.updateMany).not.toHaveBeenCalled();
  });
});
