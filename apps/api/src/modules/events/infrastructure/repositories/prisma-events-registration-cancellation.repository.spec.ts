import { randomUUID } from 'node:crypto';
import { PrismaEventsRepository } from './prisma-events.repository';

const userId = randomUUID();
const registrationId = randomUUID();
const now = new Date('2026-11-01T12:00:00Z');

function databaseWith(status: string | null = 'CONFIRMADA', endDate = new Date(now.getTime() + 1)) {
  const registration = {
    id: registrationId,
    id_usuario: userId,
    id_evento: randomUUID(),
    fecha_inscripcion: new Date('2026-10-01T12:00:00Z'),
    estado: status,
  };
  const event = { fecha_fin: endDate, cupo_maximo: 10 };
  const pass = { estado: 'VIGENTE' };
  let failUpdate = false;
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    inscripcionEvento: {
      findFirst: jest.fn(async ({ where }: { where: { id: string; id_usuario: string } }) =>
        registration.id === where.id && registration.id_usuario === where.id_usuario
          ? { estado: registration.estado, evento: { fecha_fin: event.fecha_fin } }
          : null,
      ),
      updateMany: jest.fn(
        async ({
          where,
          data,
        }: {
          where: {
            id: string;
            id_usuario: string;
            estado: string;
            evento: { is: { fecha_fin: { gt: Date } } };
          };
          data: { estado: string };
        }) => {
          if (failUpdate) {
            throw new Error('PERSISTENCE_FAILED');
          }
          if (
            registration.id !== where.id ||
            registration.id_usuario !== where.id_usuario ||
            registration.estado !== where.estado ||
            !(event.fecha_fin > where.evento.is.fecha_fin.gt)
          ) {
            return { count: 0 };
          }
          registration.estado = data.estado;
          return { count: 1 };
        },
      ),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    evento: { update: jest.fn(), updateMany: jest.fn() },
    paseQr: {
      update: jest.fn(),
      updateMany: jest.fn(async () => {
        pass.estado = 'INVALIDADO';
        return { count: 1 };
      }),
      delete: jest.fn(),
    },
  };
  const prisma = {
    $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx)),
  };
  return {
    registration,
    event,
    pass,
    tx,
    prisma,
    repository: new PrismaEventsRepository(prisma as never),
    failUpdate: () => {
      failUpdate = true;
    },
  };
}

describe('Cancelación de inscripción en PrismaEventsRepository', () => {
  it('cambia únicamente el estado y conserva el registro histórico', async () => {
    const db = databaseWith();
    const before = structuredClone(db.registration);
    await expect(
      db.repository.cancelRegistration(userId, registrationId, now),
    ).resolves.toBeUndefined();
    expect(db.registration).toEqual({ ...before, estado: 'CANCELADA' });
    expect(db.prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { timeout: 15000 });
    expect(db.tx.inscripcionEvento.findFirst).toHaveBeenCalledWith({
      where: { id: registrationId, id_usuario: userId },
      select: { estado: true, evento: { select: { fecha_fin: true } } },
    });
    expect(db.tx.inscripcionEvento.updateMany).toHaveBeenCalledWith({
      where: {
        id: registrationId,
        id_usuario: userId,
        estado: 'CONFIRMADA',
        evento: { is: { fecha_fin: { gt: now } } },
      },
      data: { estado: 'CANCELADA' },
    });
    expect(db.tx.inscripcionEvento.delete).not.toHaveBeenCalled();
    expect(db.tx.inscripcionEvento.deleteMany).not.toHaveBeenCalled();
    expect(db.tx.evento.update).not.toHaveBeenCalled();
    expect(db.tx.evento.updateMany).not.toHaveBeenCalled();
    expect(db.tx.paseQr.update).not.toHaveBeenCalled();
    expect(db.tx.paseQr.updateMany).toHaveBeenCalledWith({
      where: { id_inscripcion: registrationId },
      data: { estado: 'INVALIDADO' },
    });
    expect(db.tx.paseQr.delete).not.toHaveBeenCalled();
    expect(db.event.cupo_maximo).toBe(10);
    expect(db.pass.estado).toBe('INVALIDADO');
  });

  it('rechaza una segunda cancelación sin volver a escribir', async () => {
    const db = databaseWith();
    await db.repository.cancelRegistration(userId, registrationId, now);
    await expect(
      db.repository.cancelRegistration(userId, registrationId, now),
    ).rejects.toMatchObject({
      code: 'EVENT_REGISTRATION_NOT_CONFIRMED',
    });
    expect(db.tx.inscripcionEvento.updateMany).toHaveBeenCalledTimes(1);
    expect(db.registration.estado).toBe('CANCELADA');
  });

  it.each(['ajena', 'inexistente'])('rechaza una inscripción %s sin escribir', async (kind) => {
    const db = databaseWith();
    const before = structuredClone(db.registration);
    await expect(
      db.repository.cancelRegistration(
        kind === 'ajena' ? randomUUID() : userId,
        kind === 'inexistente' ? randomUUID() : registrationId,
        now,
      ),
    ).rejects.toMatchObject({ reason: 'missing', code: 'EVENT_REGISTRATION_NOT_FOUND' });
    expect(db.tx.inscripcionEvento.updateMany).not.toHaveBeenCalled();
    expect(db.registration).toEqual(before);
  });

  it.each([-1, 0])('rechaza un evento que termina ahora + %i ms', async (offset) => {
    const db = databaseWith('CONFIRMADA', new Date(now.getTime() + offset));
    await expect(
      db.repository.cancelRegistration(userId, registrationId, now),
    ).rejects.toMatchObject({
      code: 'EVENT_REGISTRATION_NOT_CANCELLABLE',
    });
    expect(db.tx.inscripcionEvento.updateMany).not.toHaveBeenCalled();
    expect(db.registration.estado).toBe('CONFIRMADA');
  });

  it('solo admite una de dos cancelaciones simultáneas en el doble de persistencia', async () => {
    const db = databaseWith();
    const results = await Promise.allSettled([
      db.repository.cancelRegistration(userId, registrationId, now),
      db.repository.cancelRegistration(userId, registrationId, now),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(db.registration.estado).toBe('CANCELADA');
  });

  it('devuelve un conflicto si el estado cambia entre lectura y escritura', async () => {
    const db = databaseWith();
    db.tx.inscripcionEvento.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      db.repository.cancelRegistration(userId, registrationId, now),
    ).rejects.toMatchObject({
      reason: 'conflict',
      code: 'EVENT_REGISTRATION_NOT_CANCELLABLE',
    });
    expect(db.registration.estado).toBe('CONFIRMADA');
  });

  it('propaga un fallo de persistencia sin borrar ni modificar el historial', async () => {
    const db = databaseWith();
    const before = structuredClone(db.registration);
    db.failUpdate();
    await expect(db.repository.cancelRegistration(userId, registrationId, now)).rejects.toThrow(
      'PERSISTENCE_FAILED',
    );
    expect(db.registration).toEqual(before);
    expect(db.tx.inscripcionEvento.delete).not.toHaveBeenCalled();
    expect(db.tx.paseQr.updateMany).not.toHaveBeenCalled();
  });
});
