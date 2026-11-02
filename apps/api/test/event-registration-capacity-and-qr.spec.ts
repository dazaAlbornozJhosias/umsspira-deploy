import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { GenerateEventPassService } from '../src/modules/events/application/generate-event-pass.service';
import { EventPassRules } from '../src/modules/events/domain/event-pass.rules';
import { PrismaEventsRepository } from '../src/modules/events/infrastructure/repositories/prisma-events.repository';
import { eventInclude } from '../src/modules/events/infrastructure/translators/event.translator';
import { presentEvent } from '../src/modules/events/http/presenters/event.presenter';

const now = new Date('2026-11-01T12:00:00Z');
const userId = randomUUID();
const eventId = randomUUID();
const registrationId = randomUUID();

type Registration = {
  id: string;
  id_evento: string;
  id_usuario: string;
  estado: string;
  fecha_inscripcion: Date;
};
type Pass = {
  id: string;
  id_inscripcion: string;
  estado: string;
  token_hash: string;
  fecha_generacion: Date;
  fecha_expiracion: Date | null;
};

function pause() {
  let entered!: () => void;
  let resume!: () => void;
  const reached = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const released = new Promise<void>((resolve) => {
    resume = resolve;
  });
  return {
    reached,
    resume,
    wait: async () => {
      entered();
      await released;
    },
  };
}

// Doble transaccional: los cambios se publican al confirmar y se descartan al fallar.
// El bloqueo simulado permite comprobar ambos órdenes de generación y cancelación.
function databaseWithPass(hasPass = true) {
  let state = {
    registrations: [
      {
        id: registrationId,
        id_evento: eventId,
        id_usuario: userId,
        estado: 'CONFIRMADA',
        fecha_inscripcion: now,
      },
      {
        id: randomUUID(),
        id_evento: eventId,
        id_usuario: randomUUID(),
        estado: 'CONFIRMADA',
        fecha_inscripcion: now,
      },
      {
        id: randomUUID(),
        id_evento: eventId,
        id_usuario: randomUUID(),
        estado: 'CANCELADA',
        fecha_inscripcion: now,
      },
      {
        id: randomUUID(),
        id_evento: randomUUID(),
        id_usuario: randomUUID(),
        estado: 'CONFIRMADA',
        fecha_inscripcion: now,
      },
    ] as Registration[],
    passes: (hasPass
      ? [
          {
            id: randomUUID(),
            id_inscripcion: registrationId,
            estado: 'VIGENTE',
            token_hash: 'token-de-prueba',
            fecha_generacion: now,
            fecha_expiracion: new Date('2099-01-01T18:00:00Z'),
          },
        ]
      : []) as Pass[],
  };
  const event = {
    id: eventId,
    id_usuario: randomUUID(),
    titulo: 'Feria',
    descripcion: null,
    fecha_inicio: new Date('2099-01-01T10:00:00Z'),
    fecha_fin: new Date('2099-01-01T18:00:00Z'),
    fecha_creacion: now,
    cupo_maximo: 2,
    ubicacion: null,
    id_portada: null,
    imagen_url: null,
    estado: 'PUBLICADO',
    archivado: false,
    fecha_archivado: null,
  };
  const calls = {
    lock: jest.fn(),
    registrationUpdate: jest.fn(),
    passUpdate: jest.fn(),
    passUpsert: jest.fn(),
    eventRead: jest.fn(),
  };
  const controls = {
    failInvalidation: false,
    failGeneration: false,
    beforeInvalidation: async () => {},
    beforeUpsert: async () => {},
  };
  let queue = Promise.resolve();
  async function acquire() {
    const previous = queue;
    let release!: () => void;
    queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    return release;
  }
  function transaction() {
    let staged: typeof state | undefined;
    let release: (() => void) | undefined;
    function data() {
      if (!staged) {
        throw new Error('Falta bloquear antes de leer o escribir');
      }
      return staged;
    }
    const tx = {
      $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
        calls.lock(strings, ...values);
        release = await acquire();
        staged = structuredClone(state);
        return [];
      },
      inscripcionEvento: {
        findFirst: async ({ where }: { where: { id: string; id_usuario: string } }) => {
          const row = data().registrations.find(
            (item) => item.id === where.id && item.id_usuario === where.id_usuario,
          );
          return row ? { estado: row.estado, evento: { fecha_fin: event.fecha_fin } } : null;
        },
        findUnique: async ({ where }: { where: { id: string } }) => {
          const row = data().registrations.find((item) => item.id === where.id);
          return row ? { ...row, evento: event } : null;
        },
        updateMany: async (args: {
          where: { id: string; id_usuario: string; estado: string };
          data: { estado: string };
        }) => {
          calls.registrationUpdate(args);
          const row = data().registrations.find(
            (item) =>
              item.id === args.where.id &&
              item.id_usuario === args.where.id_usuario &&
              item.estado === args.where.estado,
          );
          if (!row) {
            return { count: 0 };
          }
          row.estado = args.data.estado;
          return { count: 1 };
        },
        count: async ({ where }: { where: { id_evento: string; estado: string } }) =>
          data().registrations.filter(
            (row) => row.id_evento === where.id_evento && row.estado === where.estado,
          ).length,
        create: async ({ data: input }: { data: Omit<Registration, 'id'> }) => {
          const row = { id: randomUUID(), ...input };
          data().registrations.push(row);
          return row;
        },
      },
      evento: { findUnique: async () => event },
      paseQr: {
        updateMany: async (args: {
          where: { id_inscripcion: string };
          data: { estado: string };
        }) => {
          calls.passUpdate(args);
          await controls.beforeInvalidation();
          const rows = data().passes.filter(
            (row) => row.id_inscripcion === args.where.id_inscripcion,
          );
          for (const row of rows) {
            row.estado = args.data.estado;
          }
          if (controls.failInvalidation) {
            throw new Error('FALLO_INVALIDACION_QR');
          }
          return { count: rows.length };
        },
        upsert: async (args: {
          where: { id_inscripcion: string };
          create: Omit<Pass, 'id' | 'fecha_generacion'>;
        }) => {
          calls.passUpsert(args);
          await controls.beforeUpsert();
          if (controls.failGeneration) {
            throw new Error('FALLO_GENERACION_QR');
          }
          let row = data().passes.find((item) => item.id_inscripcion === args.where.id_inscripcion);
          if (!row) {
            row = { id: randomUUID(), fecha_generacion: now, ...args.create };
            data().passes.push(row);
          }
          return row;
        },
      },
    };
    return {
      tx,
      commit: () => {
        if (staged) {
          state = staged;
        }
      },
      release: () => release?.(),
    };
  }
  function eventRow(args: { include: typeof eventInclude }) {
    calls.eventRead(args);
    const count = state.registrations.filter(
      (row) =>
        row.id_evento === eventId &&
        row.estado === args.include._count.select.inscripcion_evento_registros.where.estado,
    ).length;
    return {
      ...event,
      usuario: { nombre: 'Organizador' },
      _count: { inscripcion_evento_registros: count },
    };
  }
  const prisma = {
    $transaction: async <Result>(
      callback: (tx: ReturnType<typeof transaction>['tx']) => Promise<Result>,
    ) => {
      const context = transaction();
      try {
        const result = await callback(context.tx);
        context.commit();
        return result;
      } finally {
        context.release();
      }
    },
    evento: {
      findFirst: async (args: { include: typeof eventInclude }) => eventRow(args),
      findMany: async (args: { include: typeof eventInclude }) => [eventRow(args)],
    },
  };
  return {
    get state() {
      return state;
    },
    event,
    calls,
    controls,
    repository: new PrismaEventsRepository(prisma as never),
    generator: new GenerateEventPassService(prisma as never),
  };
}

describe('Consistencia de ocupación y QR al cancelar', () => {
  it('recalcula ocupación y libera el cupo sin alterar el máximo ni el historial', async () => {
    const db = databaseWithPass();
    const historical = structuredClone(db.state.registrations);
    expect(presentEvent(await db.repository.published(eventId)).currentCapacity).toBe(2);
    await db.repository.cancelRegistration(userId, registrationId, now);
    const response = presentEvent(await db.repository.published(eventId));
    expect(response.currentCapacity).toBe(1);
    expect(response.maxCapacity).toBe(2);
    expect(db.state.registrations).toEqual(
      historical.map((row) => (row.id === registrationId ? { ...row, estado: 'CANCELADA' } : row)),
    );
    expect(db.calls.eventRead).toHaveBeenLastCalledWith(
      expect.objectContaining({ include: eventInclude }),
    );
    expect(db.state.passes[0].estado).toBe('INVALIDADO');
  });

  it('permite inscribir a otra persona en el cupo liberado', async () => {
    const db = databaseWithPass();
    await expect(db.repository.register(randomUUID(), eventId)).rejects.toMatchObject({
      code: 'EVENT_CAPACITY_REACHED',
    });
    await db.repository.cancelRegistration(userId, registrationId, now);
    const result = await db.repository.register(randomUUID(), eventId);
    expect(result.currentCapacity).toBe(2);
    expect(db.state.registrations.find((row) => row.id === registrationId)?.estado).toBe(
      'CANCELADA',
    );
    expect(db.event.cupo_maximo).toBe(2);
  });

  it.each(['catalog', 'owned', 'findOwned'] as const)(
    'incluye solo confirmadas en la lectura %s',
    async (operation) => {
      const db = databaseWithPass();
      await db.repository.cancelRegistration(userId, registrationId, now);
      const result =
        operation === 'catalog'
          ? await db.repository.catalog()
          : operation === 'owned'
            ? await db.repository.owned(db.event.id_usuario)
            : await db.repository.findOwned(db.event.id_usuario, eventId);
      const event = Array.isArray(result) ? result[0] : result;
      expect(event.currentCapacity).toBe(1);
    },
  );

  it('permite cancelar sin que exista pase QR', async () => {
    const db = databaseWithPass(false);
    await expect(
      db.repository.cancelRegistration(userId, registrationId, now),
    ).resolves.toBeUndefined();
    expect(db.state.passes).toEqual([]);
    expect((await db.repository.published(eventId)).currentCapacity).toBe(1);
  });

  it.each(['VIGENTE', 'VENCIDO', 'INVALIDADO'])(
    'invalida un pase %s sin eliminarlo ni alterar otros pases',
    async (status) => {
      const db = databaseWithPass();
      db.state.passes[0].estado = status;
      const other = {
        ...db.state.passes[0],
        id: randomUUID(),
        id_inscripcion: randomUUID(),
        estado: 'VIGENTE',
      };
      db.state.passes.push(other);
      const before = structuredClone(db.state.passes);
      await db.repository.cancelRegistration(userId, registrationId, now);
      expect(db.state.passes).toEqual([{ ...before[0], estado: 'INVALIDADO' }, before[1]]);
      expect(
        EventPassRules.resolveEffectiveStatus(
          db.state.passes[0].estado,
          'CANCELADA',
          'PUBLICADO',
          db.event.fecha_fin,
          now,
        ),
      ).toEqual({ status: 'INVALIDADO', isValid: false });
    },
  );

  it('descarta cancelación, cambio QR y liberación del cupo si falla la invalidación', async () => {
    const db = databaseWithPass();
    const before = structuredClone(db.state);
    db.controls.failInvalidation = true;
    await expect(db.repository.cancelRegistration(userId, registrationId, now)).rejects.toThrow(
      'FALLO_INVALIDACION_QR',
    );
    expect(db.state).toEqual(before);
    expect((await db.repository.published(eventId)).currentCapacity).toBe(2);
  });

  it('conserva ocupación y pase ante una cancelación ajena', async () => {
    const db = databaseWithPass();
    const before = structuredClone(db.state);
    await expect(
      db.repository.cancelRegistration(randomUUID(), registrationId, now),
    ).rejects.toMatchObject({ code: 'EVENT_REGISTRATION_NOT_FOUND' });
    expect(db.state).toEqual(before);
    expect(db.calls.passUpdate).not.toHaveBeenCalled();
  });

  it('no libera un segundo cupo ni reescribe el QR al repetir la cancelación', async () => {
    const db = databaseWithPass();
    await db.repository.cancelRegistration(userId, registrationId, now);
    const before = structuredClone(db.state);
    await expect(
      db.repository.cancelRegistration(userId, registrationId, now),
    ).rejects.toMatchObject({ code: 'EVENT_REGISTRATION_NOT_CONFIRMED' });
    expect(db.state).toEqual(before);
    expect(db.calls.passUpdate).toHaveBeenCalledTimes(1);
  });

  it('invalida el pase si la generación adquiere primero el bloqueo', async () => {
    const db = databaseWithPass(false);
    const gate = pause();
    db.controls.beforeUpsert = gate.wait;
    const generation = db.generator.execute(registrationId, userId);
    await gate.reached;
    const cancellation = db.repository.cancelRegistration(userId, registrationId, now);
    gate.resume();
    await Promise.all([generation, cancellation]);
    expect(db.state.registrations[0].estado).toBe('CANCELADA');
    expect(db.state.passes).toHaveLength(1);
    expect(db.state.passes[0].estado).toBe('INVALIDADO');
    expect(db.calls.lock).toHaveBeenCalledTimes(2);
    for (const call of db.calls.lock.mock.calls) {
      expect((call[0] as TemplateStringsArray).join('?')).toBe(
        'SELECT id FROM inscripcion_evento WHERE id = ?::uuid FOR UPDATE',
      );
      expect(call[1]).toBe(registrationId);
    }
  });

  it('impide generar un pase si la cancelación adquiere primero el bloqueo', async () => {
    const db = databaseWithPass(false);
    const gate = pause();
    db.controls.beforeInvalidation = gate.wait;
    const cancellation = db.repository.cancelRegistration(userId, registrationId, now);
    await gate.reached;
    const generation = db.generator.execute(registrationId, userId);
    const rejected = expect(generation).rejects.toBeInstanceOf(BadRequestException);
    gate.resume();
    await cancellation;
    await rejected;
    expect(db.state.passes).toEqual([]);
    expect(db.state.registrations[0].estado).toBe('CANCELADA');
    expect(db.calls.passUpsert).not.toHaveBeenCalled();
  });

  it('conserva la idempotencia de generación sin reactivar un pase invalidado', async () => {
    const db = databaseWithPass();
    db.state.passes[0].estado = 'INVALIDADO';
    const before = structuredClone(db.state.passes);
    const result = await db.generator.execute(registrationId, userId);
    expect(db.state.passes).toEqual(before);
    expect(result.isValidForAccess).toBe(false);
    expect(result.status).toBe('INVALIDADO');
  });

  it('libera el bloqueo tras un fallo de generación y permite cancelar después', async () => {
    const db = databaseWithPass(false);
    const before = structuredClone(db.state);
    db.controls.failGeneration = true;
    await expect(db.generator.execute(registrationId, userId)).rejects.toThrow(
      'FALLO_GENERACION_QR',
    );
    expect(db.state).toEqual(before);
    await db.repository.cancelRegistration(userId, registrationId, now);
    expect(db.state.registrations[0].estado).toBe('CANCELADA');
    expect(db.state.passes).toEqual([]);
  });
});
