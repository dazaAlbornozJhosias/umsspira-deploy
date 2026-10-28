import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { PrismaEventsRepository } from './prisma-events.repository';

type StoredRegistration = {
  id: string;
  id_evento: string;
  id_usuario: string;
  fecha_inscripcion: Date;
  estado: string;
};

class EventRegistrationDatabase {
  readonly registrations: StoredRegistration[];
  readonly event: {
    archivado: boolean;
    estado: string;
    fecha_fin: Date | null;
    cupo_maximo: number | null;
  } | null;
  failCreate = false;
  private locked = false;
  private readonly queue: Array<() => void> = [];

  constructor(
    event: EventRegistrationDatabase['event'],
    registrations: StoredRegistration[] = [],
  ) {
    this.event = event;
    this.registrations = [...registrations];
  }

  readonly prisma = {
    $transaction: async <Result>(
      callback: (transaction: Record<string, unknown>) => Promise<Result>,
    ): Promise<Result> => {
      const staged: StoredRegistration[] = [];
      let acquired = false;
      const transaction = {
        $queryRaw: async () => {
          await this.acquire();
          acquired = true;
          return [];
        },
        evento: {
          findUnique: async () => this.event,
        },
        inscripcionEvento: {
          findFirst: async ({ where }: { where: Partial<StoredRegistration> }) =>
            [...this.registrations, ...staged].find(
              (registration) =>
                registration.id_evento === where.id_evento &&
                registration.id_usuario === where.id_usuario &&
                registration.estado === where.estado,
            ) ?? null,
          count: async ({ where }: { where: Partial<StoredRegistration> }) =>
            [...this.registrations, ...staged].filter(
              (registration) =>
                registration.id_evento === where.id_evento && registration.estado === where.estado,
            ).length,
          create: async ({ data }: { data: Omit<StoredRegistration, 'id'> }) => {
            if (this.failCreate) {
              throw new Error('PERSISTENCE_FAILED');
            }
            const registration = { id: randomUUID(), ...data };
            staged.push(registration);
            return registration;
          },
        },
      };
      try {
        const result = await callback(transaction);
        this.registrations.push(...staged);
        return result;
      } finally {
        if (acquired) {
          this.release();
        }
      }
    },
  };

  private async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
  }

  private release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
      return;
    }
    this.locked = false;
  }
}

function availableEvent() {
  return {
    archivado: false,
    estado: 'PUBLICADO',
    fecha_fin: new Date('2099-01-01T00:00:00.000Z'),
    cupo_maximo: 2,
  };
}

function repository(database: EventRegistrationDatabase) {
  return new PrismaEventsRepository(database.prisma as unknown as PrismaService);
}

describe('PrismaEventsRepository.register', () => {
  const eventId = randomUUID();
  const userId = randomUUID();

  it('confirma una inscripciÃ³n y devuelve la ocupaciÃ³n actualizada', async () => {
    const database = new EventRegistrationDatabase(availableEvent());

    const registration = await repository(database).register(userId, eventId);

    expect(registration).toMatchObject({
      eventId,
      userId,
      status: 'CONFIRMADA',
      currentCapacity: 1,
    });
    expect(database.registrations).toHaveLength(1);
  });

  it('rechaza un evento inexistente o no disponible', async () => {
    await expect(repository(new EventRegistrationDatabase(null)).register(userId, eventId)).rejects.toMatchObject({
      code: 'EVENT_NOT_FOUND',
    });

    for (const event of [
      { ...availableEvent(), estado: 'BORRADOR' },
      { ...availableEvent(), estado: 'CANCELADO' },
      { ...availableEvent(), fecha_fin: new Date('2020-01-01T00:00:00.000Z') },
    ]) {
      await expect(repository(new EventRegistrationDatabase(event)).register(userId, eventId)).rejects.toMatchObject({
        code: 'EVENT_NOT_AVAILABLE',
      });
    }
  });

  it('no inserta una inscripciÃ³n cuando no quedan cupos', async () => {
    const database = new EventRegistrationDatabase({ ...availableEvent(), cupo_maximo: 1 }, [
      {
        id: randomUUID(),
        id_evento: eventId,
        id_usuario: randomUUID(),
        fecha_inscripcion: new Date(),
        estado: 'CONFIRMADA',
      },
    ]);

    await expect(repository(database).register(userId, eventId)).rejects.toMatchObject({
      code: 'EVENT_CAPACITY_REACHED',
    });
    expect(database.registrations).toHaveLength(1);
  });

  it('rechaza una inscripciÃ³n confirmada duplicada', async () => {
    const database = new EventRegistrationDatabase(availableEvent(), [
      {
        id: randomUUID(),
        id_evento: eventId,
        id_usuario: userId,
        fecha_inscripcion: new Date(),
        estado: 'CONFIRMADA',
      },
    ]);

    await expect(repository(database).register(userId, eventId)).rejects.toMatchObject({
      code: 'EVENT_REGISTRATION_ALREADY_CONFIRMED',
    });
  });

  it('conserva una inscripciÃ³n cancelada y crea una nueva confirmada', async () => {
    const database = new EventRegistrationDatabase(availableEvent(), [
      {
        id: randomUUID(),
        id_evento: eventId,
        id_usuario: userId,
        fecha_inscripcion: new Date(),
        estado: 'CANCELADA',
      },
    ]);

    await repository(database).register(userId, eventId);

    expect(database.registrations).toHaveLength(2);
    expect(database.registrations.map((registration) => registration.estado)).toEqual([
      'CANCELADA',
      'CONFIRMADA',
    ]);
  });

  it('serializa solicitudes simultÃ¡neas para el Ãºltimo cupo', async () => {
    const database = new EventRegistrationDatabase({ ...availableEvent(), cupo_maximo: 1 });
    const registrations = await Promise.allSettled([
      repository(database).register(randomUUID(), eventId),
      repository(database).register(randomUUID(), eventId),
    ]);

    expect(registrations.filter((registration) => registration.status === 'fulfilled')).toHaveLength(1);
    expect(registrations.filter((registration) => registration.status === 'rejected')).toHaveLength(1);
    expect(database.registrations).toHaveLength(1);
  });

  it('serializa solicitudes simultÃ¡neas del mismo titulado', async () => {
    const database = new EventRegistrationDatabase(availableEvent());
    const registrations = await Promise.allSettled([
      repository(database).register(userId, eventId),
      repository(database).register(userId, eventId),
    ]);

    expect(registrations.filter((registration) => registration.status === 'fulfilled')).toHaveLength(1);
    expect(registrations.filter((registration) => registration.status === 'rejected')).toHaveLength(1);
    expect(database.registrations).toHaveLength(1);
  });

  it('revierte la operaciÃ³n cuando falla la persistencia', async () => {
    const database = new EventRegistrationDatabase(availableEvent());
    database.failCreate = true;

    await expect(repository(database).register(userId, eventId)).rejects.toThrow('PERSISTENCE_FAILED');
    expect(database.registrations).toHaveLength(0);
  });
});
