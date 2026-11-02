import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { StoredFile } from '../../../../shared/files/contracts/uploaded-file';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { EventsRepository } from '../../application/ports/events-repository.port';
import type { CreateEventInput, EventInput } from '../../application/contracts/event-inputs';
import {
  assertDraft,
  assertRetirable,
  inactiveStatus,
  validateEventDates,
} from '../../domain/policies/event.policy';
import type { InactiveEvent, RetiredEvent } from '../../domain/entities/event';
import { eventInclude, toEvent } from '../translators/event.translator';
import { assertRegistrationCancellable } from '../../domain/policies/event-registration.policy';
import type {
  EventParticipants,
  ParticipantPassStatus,
} from '../../domain/entities/event-participants';
import { buildOccupation } from '../../domain/policies/event-occupation.policy';
import type { MyEventRegistration } from '../../domain/entities/my-event-registration';

@Injectable()
export class PrismaEventsRepository implements EventsRepository {
  private readonly logger = new Logger(PrismaEventsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async catalog() {
    const rows = await this.prisma.evento.findMany({
      where: {
        estado: 'PUBLICADO',
        archivado: false,
        fecha_fin: { gt: new Date() },
        cupo_maximo: { gte: 1, lte: 10000 },
      },
      include: eventInclude,
      orderBy: [{ fecha_inicio: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toEvent);
  }

  async published(id: string) {
    const row = await this.prisma.evento.findFirst({
      where: { id, estado: 'PUBLICADO', archivado: false, cupo_maximo: { gte: 1, lte: 10000 } },
      include: eventInclude,
    });
    if (!row) {
      return this.missingEvent();
    }
    return toEvent(row);
  }

  async owned(ownerId: string) {
    const rows = await this.prisma.evento.findMany({
      where: { id_usuario: ownerId, archivado: false },
      include: eventInclude,
      orderBy: [{ fecha_creacion: 'desc' }, { id: 'asc' }],
    });
    return rows.map(toEvent);
  }

  async findOwned(ownerId: string, id: string) {
    const row = await this.prisma.evento.findFirst({
      where: { id, id_usuario: ownerId, archivado: false },
      include: eventInclude,
    });
    if (!row) {
      return this.missingEvent();
    }
    return toEvent(row);
  }

  async create(ownerId: string, input: CreateEventInput) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.checkCover(tx, ownerId, input.coverId);
        const row = await tx.evento.create({
          data: {
            id_usuario: ownerId,
            ...this.eventData(input),
            estado: input.status ?? 'BORRADOR',
            fecha_creacion: new Date(),
          },
          include: eventInclude,
        });
        return toEvent(row);
      },
      { timeout: 15000 },
    );
  }

  async updateDraft(ownerId: string, id: string, input: EventInput) {
    return this.prisma.$transaction(
      async (tx) => {
        const current = await this.lockOwned(tx, ownerId, id);
        assertDraft(toEvent(current));
        await this.checkCover(tx, ownerId, input.coverId, id);
        const row = await tx.evento.update({
          where: { id, id_usuario: ownerId, estado: 'BORRADOR', archivado: false },
          data: this.eventData(input),
          include: eventInclude,
        });
        if (
          input.coverId !== undefined &&
          current.id_portada &&
          current.id_portada !== input.coverId
        ) {
          await tx.portadaEvento.deleteMany({
            where: { id: current.id_portada, id_usuario: ownerId, evento: { is: null } },
          });
        }
        return toEvent(row);
      },
      { timeout: 15000 },
    );
  }

  async updatePublished(ownerId: string, id: string, input: EventInput) {
    validateEventDates(new Date(input.startDate), new Date(input.endDate));
    return this.prisma.$transaction(async (tx) => {
      const current = await this.lockOwned(tx, ownerId, id);
      if (current.estado !== 'PUBLICADO') {
        throw new BusinessRuleError('conflict', 'EVENT_NOT_PUBLISHED', 'El evento ya no está publicado');
      }
      const confirmedCount = await tx.inscripcionEvento.count({
        where: { id_evento: id, estado: 'CONFIRMADA' },
      });
      if (input.maxCapacity < confirmedCount) {
        throw new BusinessRuleError(
          'invalid',
          'CAPACITY_BELOW_CONFIRMED_REGISTRATIONS',
          `El cupo no puede ser menor a ${confirmedCount} inscripciones confirmadas`,
        );
      }
      await this.checkCover(tx, ownerId, input.coverId, id);
      const updated = await tx.evento.update({
        where: { id, id_usuario: ownerId, estado: 'PUBLICADO', archivado: false },
        data: this.eventData(input),
        include: eventInclude,
      });
      if (input.coverId !== undefined && current.id_portada && current.id_portada !== input.coverId) {
        await tx.portadaEvento.deleteMany({
          where: { id: current.id_portada, id_usuario: ownerId, evento: { is: null } },
        });
      }
      return toEvent(updated);
    }, { timeout: 15000 });
  }

  async publishDraft(ownerId: string, id: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const row = await this.lockOwned(tx, ownerId, id);
        const event = toEvent(row);
        assertDraft(event);
        validateEventDates(event.startDate, event.endDate);
        if (event.maxCapacity < 1 || event.maxCapacity > 10000) {
          throw new BusinessRuleError(
            'invalid',
            'INVALID_EVENT_CAPACITY',
            'El cupo debe estar entre 1 y 10000',
          );
        }
        return toEvent(
          await tx.evento.update({
            where: { id, id_usuario: ownerId, estado: 'BORRADOR', archivado: false },
            data: { estado: 'PUBLICADO' },
            include: eventInclude,
          }),
        );
      },
      { timeout: 15000 },
    );
  }
  async mine(userId: string): Promise<MyEventRegistration[]> {
    const rows = await this.prisma.inscripcionEvento.findMany({
      where: { id_usuario: userId },
      include: { evento: true, pase_qr: { select: { id: true } } },
      orderBy: [{ evento: { fecha_inicio: 'asc' } }, { id: 'asc' }],
    });
    return rows.flatMap((row) => {
      const event = row.evento;
      const eventStatus = event?.estado?.toUpperCase();
      const status = row.estado?.toUpperCase();
      if (
        !event ||
        !event.titulo ||
        !event.fecha_inicio ||
        !event.fecha_fin ||
        !row.fecha_inscripcion ||
        !['BORRADOR', 'PUBLICADO', 'CANCELADO'].includes(eventStatus ?? '') ||
        !['CONFIRMADA', 'CANCELADA'].includes(status ?? '')
      ) {
        return [];
      }
      return [
        {
          id: row.id,
          status: status as MyEventRegistration['status'],
          registeredAt: row.fecha_inscripcion,
          hasPass: row.pase_qr !== null,
          event: {
            id: event.id,
            title: event.titulo,
            startDate: event.fecha_inicio,
            endDate: event.fecha_fin,
            location: event.ubicacion,
            status: eventStatus as MyEventRegistration['event']['status'],
          },
        },
      ];
    });
  }


  async register(userId: string, eventId: string) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM evento WHERE id = ${eventId}::uuid FOR UPDATE`;
          const event = await tx.evento.findUnique({
            where: { id: eventId },
            select: {
              archivado: true,
              estado: true,
              fecha_fin: true,
              cupo_maximo: true,
            },
          });
          if (!event) {
            return this.missingEvent();
          }
          if (
            event.archivado ||
            event.estado !== 'PUBLICADO' ||
            !event.fecha_fin ||
            event.fecha_fin <= new Date() ||
            !event.cupo_maximo ||
            event.cupo_maximo < 1
          ) {
            throw new BusinessRuleError(
              'conflict',
              'EVENT_NOT_AVAILABLE',
              'El evento no está disponible para inscripciones',
            );
          }
          const existing = await tx.inscripcionEvento.findFirst({
            where: { id_evento: eventId, id_usuario: userId, estado: 'CONFIRMADA' },
            select: { id: true },
          });
          if (existing) {
            throw new BusinessRuleError(
              'conflict',
              'EVENT_REGISTRATION_ALREADY_CONFIRMED',
              'Ya tienes una inscripción confirmada para este evento',
            );
          }
          const currentCapacity = await tx.inscripcionEvento.count({
            where: { id_evento: eventId, estado: 'CONFIRMADA' },
          });
          if (currentCapacity >= event.cupo_maximo) {
            throw new BusinessRuleError(
              'conflict',
              'EVENT_CAPACITY_REACHED',
              'El evento ya no tiene cupos disponibles',
            );
          }
          const registration = await tx.inscripcionEvento.create({
            data: {
              id_evento: eventId,
              id_usuario: userId,
              fecha_inscripcion: new Date(),
              estado: 'CONFIRMADA',
            },
          });
          return {
            id: registration.id,
            eventId,
            userId,
            status: 'CONFIRMADA' as const,
            registeredAt: registration.fecha_inscripcion ?? new Date(),
            currentCapacity: currentCapacity + 1,
          };
        },
        { timeout: 15000 },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BusinessRuleError(
          'conflict',
          'EVENT_REGISTRATION_ALREADY_CONFIRMED',
          'Ya tienes una inscripción confirmada para este evento',
        );
      }
      throw error;
    }
  }

  async cancelRegistration(userId: string, registrationId: string, now: Date): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        // El generador QR utiliza el mismo bloqueo antes de comprobar la inscripción.
        await tx.$queryRaw`SELECT id FROM inscripcion_evento WHERE id = ${registrationId}::uuid FOR UPDATE`;
        await this.assertCancellableWith(tx, userId, registrationId, now);
        const result = await tx.inscripcionEvento.updateMany({
          where: {
            id: registrationId,
            id_usuario: userId,
            estado: 'CONFIRMADA',
            evento: { is: { fecha_fin: { gt: now } } },
          },
          data: { estado: 'CANCELADA' },
        });
        // Revalidar al escribir impide dos cancelaciones aunque ambas lecturas sean válidas.
        if (result.count !== 1) {
          throw new BusinessRuleError(
            'conflict',
            'EVENT_REGISTRATION_NOT_CANCELLABLE',
            'La inscripción ya no está disponible para cancelación',
          );
        }
        await tx.paseQr.updateMany({
          where: { id_inscripcion: registrationId },
          data: { estado: 'INVALIDADO' },
        });
      },
      { timeout: 15000 },
    );
  }

  async assertCancellable(userId: string, registrationId: string, now: Date): Promise<void> {
    await this.assertCancellableWith(this.prisma, userId, registrationId, now);
  }

  private async assertCancellableWith(
    client: Prisma.TransactionClient | PrismaService,
    userId: string,
    registrationId: string,
    now: Date,
  ): Promise<void> {
    const registration = await client.inscripcionEvento.findFirst({
      where: { id: registrationId, id_usuario: userId },
      select: { estado: true, evento: { select: { fecha_fin: true } } },
    });
    if (!registration) {
      throw new BusinessRuleError(
        'missing',
        'EVENT_REGISTRATION_NOT_FOUND',
        'No se encontró la inscripción solicitada',
      );
    }
    assertRegistrationCancellable(
      { status: registration.estado, endDate: registration.evento?.fecha_fin ?? null },
      now,
    );
  }

  async participants(ownerId: string, eventId: string): Promise<EventParticipants> {
    const event = await this.prisma.evento.findFirst({
      where: { id: eventId, id_usuario: ownerId, archivado: false },
      select: { id: true, titulo: true, cupo_maximo: true },
    });
    if (!event) {
      return this.missingEvent();
    }
    const rows = await this.prisma.inscripcionEvento.findMany({
      where: { id_evento: eventId, estado: { in: ['CONFIRMADA', 'CANCELADA'] } },
      include: {
        usuario: { select: { nombre: true } },
        pase_qr: { select: { estado: true } },
      },
      orderBy: [{ fecha_inscripcion: 'asc' }, { id: 'asc' }],
    });
    const participants = rows.map((row) => ({
      registrationId: row.id,
      name: row.usuario?.nombre?.trim() || 'Sin nombre',
      status: row.estado === 'CANCELADA' ? ('CANCELADA' as const) : ('CONFIRMADA' as const),
      registeredAt: row.fecha_inscripcion ?? new Date(),
      passStatus: this.passStatus(row.pase_qr?.estado),
    }));
    const confirmed = participants.filter((item) => item.status === 'CONFIRMADA').length;
    return {
      eventId: event.id,
      eventTitle: event.titulo ?? '',
      occupation: buildOccupation(
        event.cupo_maximo ?? 0,
        confirmed,
        participants.length - confirmed,
      ),
      participants,
    };
  }

  async inactive(ownerId: string, now: Date): Promise<InactiveEvent[]> {
    const rows = await this.prisma.evento.findMany({
      where: {
        id_usuario: ownerId,
        archivado: false,
        OR: [{ estado: 'CANCELADO' }, { fecha_fin: { lte: now } }],
      },
      include: eventInclude,
      orderBy: [{ fecha_inicio: 'desc' }, { id: 'asc' }],
    });
    return Promise.all(
      rows.map(async (row) => {
        const event = toEvent(row);
        const status = inactiveStatus(event, now);
        if (!status) {
          throw new Error('Evento inactivo inconsistente');
        }
        return {
          ...event,
          inactiveStatus: status,
          ...(await this.relationCounts(this.prisma, row.id)),
        };
      }),
    );
  }

  async retire(ownerId: string, id: string, now: Date): Promise<RetiredEvent> {
    return this.prisma.$transaction(
      async (tx) => {
        const row = await this.lockOwned(tx, ownerId, id);
        assertRetirable(toEvent(row), now);
        const counts = await this.relationCounts(tx, id);
        const hasHistory = counts.registrationsCount > 0 || counts.passesCount > 0;

        if (hasHistory) {
          // Con historial: baja lógica para preservar la trazabilidad.
          await tx.evento.update({
            where: { id, id_usuario: ownerId, archivado: false },
            data: { archivado: true, fecha_archivado: now },
          });
        } else {
          // Sin relaciones: baja física. Se desvincula la portada para no chocar con la FK Restrict.
          if (row.id_portada) {
            await tx.evento.update({ where: { id }, data: { id_portada: null } });
          }
          await tx.evento.delete({ where: { id, id_usuario: ownerId } });
        }

        return { id, ...counts };
      },
      { timeout: 15000 },
    );
  }

  async cancelPublished(ownerId: string, id: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const row = await this.lockOwned(tx, ownerId, id);

        if (row.estado !== 'PUBLICADO') {
          throw new BusinessRuleError(
            'conflict',
            'EVENT_NOT_PUBLISHED',
            'El evento debe estar PUBLICADO para poder cancelarlo',
          );
        }

        const registrationsCount = await tx.inscripcionEvento.count({
          where: { id_evento: id },
        });

        const cancelled = await tx.evento.update({
          where: {
            id,
            id_usuario: ownerId,
            estado: 'PUBLICADO',
            archivado: false,
          },
          data: { estado: 'CANCELADO' },
          include: eventInclude,
        });

        const invalidatedPasses = await tx.paseQr.updateMany({
          where: {
            estado: 'VIGENTE',
            inscripcion: { is: { id_evento: id } },
          },
          data: { estado: 'INVALIDADO' },
        });

        return {
          event: toEvent(cancelled),
          registrationsCount,
          invalidatedPassesCount: invalidatedPasses.count,
        };
      },
      { timeout: 15000 },
    );
  }

  async saveCover(ownerId: string, file: StoredFile): Promise<void> {
    try {
      await this.prisma.portadaEvento.create({
        data: {
          id: file.id,
          id_usuario: ownerId,
          nombre: file.name,
          mime: file.mime,
          contenido: new Uint8Array(file.bytes),
          size_bytes: file.size,
        },
      });
    } catch (error) {
      this.logger.error(`No se pudo persistir la portada: ${safeCoverPersistenceError(error)}`);
      throw error;
    }
  }

  async removeCover(ownerId: string, id: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM portada_evento WHERE id = ${id}::uuid FOR UPDATE`;
        const row = await tx.portadaEvento.findFirst({
          where: { id, id_usuario: ownerId },
          select: { id: true, evento: { select: { id: true } } },
        });
        if (!row) {
          throw new BusinessRuleError(
            'missing',
            'COVER_NOT_FOUND',
            'No se encontró una portada propia',
          );
        }
        if (row.evento) {
          throw new BusinessRuleError(
            'conflict',
            'COVER_IN_USE',
            'La portada está vinculada a un evento',
          );
        }
        await tx.portadaEvento.delete({ where: { id, id_usuario: ownerId } });
      },
      { timeout: 15000 },
    );
  }

  async readCover(id: string, actor?: ActorContext): Promise<StoredFile> {
    const row = await this.prisma.portadaEvento.findFirst({
      where: {
        id,
        OR: [
          { evento: { is: { estado: 'PUBLICADO', archivado: false } } },
          ...(actor?.permissions.includes('eventos:manage') ? [{ id_usuario: actor.id }] : []),
        ],
      },
    });
    if (!row) {
      throw new BusinessRuleError(
        'missing',
        'COVER_NOT_FOUND',
        'No se encontró una portada disponible',
      );
    }
    return {
      id: row.id,
      name: row.nombre,
      mime: row.mime,
      bytes: row.contenido,
      size: row.size_bytes,
    };
  }

  private eventData(input: EventInput) {
    return {
      titulo: input.title,
      descripcion: input.description ?? null,
      fecha_inicio: new Date(input.startDate),
      fecha_fin: new Date(input.endDate),
      cupo_maximo: input.maxCapacity,
      ubicacion: input.location ?? null,
      ...(input.coverId !== undefined ? { id_portada: input.coverId } : {}),
    };
  }

  private async relationCounts(client: Prisma.TransactionClient | PrismaService, eventId: string) {
    const [registrationsCount, passesCount] = await Promise.all([
      client.inscripcionEvento.count({ where: { id_evento: eventId } }),
      client.paseQr.count({ where: { inscripcion: { id_evento: eventId } } }),
    ]);
    return { registrationsCount, passesCount };
  }

  private async lockOwned(tx: Prisma.TransactionClient, ownerId: string, id: string) {
    await tx.$queryRaw`SELECT id FROM evento WHERE id = ${id}::uuid FOR UPDATE`;
    const row = await tx.evento.findFirst({ where: { id, id_usuario: ownerId, archivado: false } });
    if (!row) {
      return this.missingEvent();
    }
    return row;
  }

  private async checkCover(
    tx: Prisma.TransactionClient,
    ownerId: string,
    id?: string | null,
    eventId?: string,
  ): Promise<void> {
    if (!id) {
      return;
    }
    await tx.$queryRaw`SELECT id FROM portada_evento WHERE id = ${id}::uuid FOR UPDATE`;
    const row = await tx.portadaEvento.findFirst({
      where: { id, id_usuario: ownerId },
      select: { evento: { select: { id: true } } },
    });
    if (!row) {
      throw new BusinessRuleError(
        'missing',
        'COVER_NOT_FOUND',
        'Utiliza una portada propia cargada en la API',
      );
    }
    if (row.evento && row.evento.id !== eventId) {
      throw new BusinessRuleError(
        'conflict',
        'COVER_IN_USE',
        'La portada ya pertenece a otro evento',
      );
    }
  }

  private passStatus(estado?: string | null): ParticipantPassStatus {
    if (!estado) {
      return 'SIN_PASE';
    }
    return estado === 'VIGENTE' ? 'VIGENTE' : 'INVALIDADO';
  }

  private missingEvent(): never {
    throw new BusinessRuleError(
      'missing',
      'EVENT_NOT_FOUND',
      'No se encontró el evento solicitado',
    );
  }
}
function safeCoverPersistenceError(error: unknown): string {
  let current = error;
  const messages: string[] = [];
  for (let depth = 0; depth < 4 && current instanceof Error; depth += 1) {
    const code = (current as Error & { code?: unknown }).code;
    const safeCode = typeof code === 'string' && /^[A-Z0-9]{5}$/.test(code) ? ` [${code}]` : '';
    const safeMessage = current.message
      .replace(/(?:params?|parameters?|values?)\s*:[\s\S]*$/i, '[detalles omitidos]')
      .replace(/postgres(?:ql)?:\/\/\S+/gi, '[conexión omitida]')
      .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, '[id omitido]')
      .slice(0, 180);
    messages.push(`${current.name}${safeCode}${safeMessage ? `: ${safeMessage}` : ''}`);
    current = (current as Error & { cause?: unknown }).cause;
  }
  return messages.join(' <- ') || (error instanceof Error ? error.name : 'Error desconocido');
}
