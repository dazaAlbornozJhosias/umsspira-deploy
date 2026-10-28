import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { CreateMentorshipRequestInput } from '../../application/contracts/create-mentorship-request.input';
import type { MentorshipRequestQuery } from '../../application/contracts/mentorship-request-query';
import type { MentorshipRequestRepository } from '../../application/ports/mentorship-request-repository.port';
import type {
  MentorSlotDay,
  MentorshipRequest,
  MentorshipRequestPage,
  MentorshipRequestStatus,
} from '../../domain/entities/mentorship-request';
import type { RegistrationSecurity } from '../../../registrations/application/ports/registration-security.port';
import { REGISTRATION_SECURITY } from '../../../registrations/application/ports/registration-security.port';
import type { Prisma } from '../../../../generated/prisma/client';
import { canReceiveMentorship } from '../../domain/policies/mentor.policy';
import { toAvailability } from '../translators/mentor.translator';
import { availabilityOrder, lockGraduate } from './mentor-transaction';

const DAY_MS = 24 * 60 * 60 * 1000;
const toDatabaseDate = (date: string) => new Date(`${date}T00:00:00.000Z`);
const toDatabaseTime = (time: string) => new Date(`1970-01-01T${time}:00.000Z`);

const requestSelect = {
  id: true,
  id_mentor: true,
  id_usuario: true,
  solicitud_fecha: true,
  solicitud_inicio: true,
  solicitud_fin: true,
  mensaje: true,
  estado: true,
  fecha_respuesta: true,
  fecha_creacion: true,
  usuario: {
    select: {
      nombre: true,
      titulado: { select: { nombre: true, apellido: true } },
    },
  },
} satisfies Prisma.MentoriaSolicitudSelect;

type MentorshipRequestRow = Prisma.MentoriaSolicitudGetPayload<{ select: typeof requestSelect }>;

function toMentorshipRequest(row: MentorshipRequestRow): MentorshipRequest {
  if (
    !row.id_mentor ||
    !row.id_usuario ||
    !row.solicitud_fecha ||
    !row.solicitud_inicio ||
    !row.solicitud_fin ||
    !row.estado
  ) {
    throw new BusinessRuleError(
      'invalid',
      'SOLICITUD_INCOMPLETA',
      'La solicitud no contiene todos los datos requeridos',
    );
  }
  const requesterName = [row.usuario?.titulado?.nombre, row.usuario?.titulado?.apellido]
    .filter(Boolean)
    .join(' ');
  return {
    id: row.id,
    mentorId: row.id_mentor,
    requesterId: row.id_usuario,
    requesterName: requesterName || row.usuario?.nombre || null,
    date: row.solicitud_fecha,
    startTime: row.solicitud_inicio,
    endTime: row.solicitud_fin,
    message: row.mensaje,
    status: row.estado,
    createdAt: row.fecha_creacion,
    respondedAt: row.fecha_respuesta,
  };
}

async function requireActiveMentorId(
  db: PrismaService | Prisma.TransactionClient,
  userId: string,
  lock = false,
): Promise<string> {
  if (lock) {
    await db.$queryRaw`SELECT id FROM titulado WHERE id_usuario = ${userId}::uuid FOR UPDATE`;
  }
  const mentor = await db.mentor.findFirst({
    where: {
      esta_activo: true,
      titulado: { id_usuario: userId, usuario: { estado: 'ACTIVO', rol: 'titulado' } },
    },
    select: { id: true },
  });
  if (!mentor) {
    throw new BusinessRuleError(
      'forbidden',
      'MENTOR_NO_HABILITADO',
      'Se requiere una participación activa como mentor',
    );
  }
  return mentor.id;
}

@Injectable()
export class PrismaMentorshipRequestRepository implements MentorshipRequestRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REGISTRATION_SECURITY) private readonly security: RegistrationSecurity,
  ) {}

  async slots(mentorId: string, now: Date, days: number): Promise<MentorSlotDay[]> {
    const mentor = await this.prisma.mentor.findUnique({
      where: { id: mentorId },
      select: {
        esta_activo: true,
        titulado: { select: { usuario: { select: { estado: true, rol: true } } } },
      },
    });
    if (!mentor) {
      throw new BusinessRuleError('missing', 'MENTOR_NOT_FOUND', 'El mentor no existe');
    }
    const mentorUser = mentor.titulado.usuario;
    const availability = await this.prisma.disponibilidadMentor.findFirst({
      where: { id_mentor: mentorId },
      orderBy: availabilityOrder,
      select: { estado: true, fecha_actualizacion: true, hora_inicio: true, hora_fin: true },
    });
    if (
      mentorUser?.estado !== 'ACTIVO' ||
      mentorUser.rol !== 'titulado' ||
      !canReceiveMentorship(mentor.esta_activo === true, toAvailability(availability).status)
    ) {
      throw new BusinessRuleError(
        'forbidden',
        'MENTOR_NOT_AVAILABLE',
        'El mentor no está habilitado para recibir solicitudes',
      );
    }

    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const last = new Date(today.getTime() + (days - 1) * DAY_MS);
    const [spaces, taken] = await Promise.all([
      this.prisma.espacioDisponibleMentor.findMany({
        where: { id_mentor: mentorId, esta_activo: true },
        select: { dia_semana: true, horario_inicio: true, horario_fin: true },
      }),
      this.prisma.mentoriaSolicitud.findMany({
        where: {
          id_mentor: mentorId,
          solicitud_fecha: { gte: today, lte: last },
          estado: { in: ['PENDIENTE', 'ACEPTADO'] },
        },
        select: { solicitud_fecha: true, solicitud_inicio: true, solicitud_fin: true },
      }),
    ]);

    const minutes = (value: Date) => value.getUTCHours() * 60 + value.getUTCMinutes();
    const label = (total: number) =>
      `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    const windowStart = availability?.hora_inicio ? minutes(availability.hora_inicio) : 0;
    const windowEnd = availability?.hora_fin ? minutes(availability.hora_fin) : 24 * 60;
    const nowMinutes = minutes(now);

    return Array.from({ length: days }, (_, index) => {
      const day = new Date(today.getTime() + index * DAY_MS);
      const key = day.toISOString().slice(0, 10);
      const busy = taken
        .filter((row) => row.solicitud_fecha?.toISOString().slice(0, 10) === key)
        .map((row) => [minutes(row.solicitud_inicio!), minutes(row.solicitud_fin!)]);
      const slots: MentorSlotDay['slots'] = [];
      for (const space of spaces) {
        if (space.dia_semana !== day.getUTCDay() || !space.horario_inicio || !space.horario_fin) {
          continue;
        }
        const end = Math.min(minutes(space.horario_fin), windowEnd);
        for (
          let start = Math.max(minutes(space.horario_inicio), windowStart);
          start + 60 <= end;
          start += 60
        ) {
          const isPast = index === 0 && start <= nowMinutes;
          const isBusy = busy.some(([from, to]) => from < start + 60 && to > start);
          if (!isPast && !isBusy) {
            slots.push({ startTime: label(start), endTime: label(start + 60) });
          }
        }
      }
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      return { date: key, slots };
    });
  }

  async create(
    userId: string,
    input: CreateMentorshipRequestInput,
    now: Date,
  ): Promise<MentorshipRequest> {
    return this.prisma.$transaction(
      async (tx) => {
        const requester = await lockGraduate(tx, userId);
        const initialMentor = await tx.mentor.findUnique({
          where: { id: input.mentorId },
          select: { id: true, id_titulado: true },
        });
        if (!initialMentor) {
          throw new BusinessRuleError('missing', 'MENTOR_NOT_FOUND', 'El mentor no existe');
        }
        if (initialMentor.id_titulado === requester.id) {
          throw new BusinessRuleError(
            'invalid',
            'MENTORSHIP_REQUEST_SELF',
            'No puedes solicitar una mentoría contigo mismo',
          );
        }

        await tx.$queryRaw`SELECT id FROM mentor WHERE id = ${initialMentor.id}::uuid FOR UPDATE`;
        const mentor = await tx.mentor.findUnique({
          where: { id: initialMentor.id },
          select: {
            id: true,
            esta_activo: true,
            titulado: {
              select: { usuario: { select: { estado: true, rol: true } } },
            },
          },
        });
        if (!mentor) {
          throw new BusinessRuleError('missing', 'MENTOR_NOT_FOUND', 'El mentor no existe');
        }
        const mentorUser = mentor.titulado.usuario;
        if (
          mentor.esta_activo !== true ||
          mentorUser?.estado !== 'ACTIVO' ||
          mentorUser.rol !== 'titulado'
        ) {
          throw new BusinessRuleError(
            'forbidden',
            'MENTOR_NOT_AVAILABLE',
            'El mentor no está habilitado para recibir solicitudes',
          );
        }

        const availability = await tx.disponibilidadMentor.findFirst({
          where: { id_mentor: mentor.id },
          orderBy: availabilityOrder,
          select: { estado: true, fecha_actualizacion: true, hora_inicio: true, hora_fin: true },
        });
        if (!canReceiveMentorship(mentor.esta_activo, toAvailability(availability).status)) {
          throw new BusinessRuleError(
            'forbidden',
            'MENTOR_NOT_AVAILABLE',
            'El mentor no está habilitado para recibir solicitudes',
          );
        }

        const date = toDatabaseDate(input.date);
        const startTime = toDatabaseTime(input.startTime);
        const endTime = toDatabaseTime(input.endTime);
        const space = await tx.espacioDisponibleMentor.findFirst({
          where: {
            id_mentor: mentor.id,
            dia_semana: date.getUTCDay(),
            esta_activo: true,
            horario_inicio: { lte: startTime },
            horario_fin: { gte: endTime },
          },
          select: { id: true },
        });
        const hasAvailabilityWindow =
          availability?.hora_inicio == null ||
          availability.hora_fin == null ||
          (startTime >= availability.hora_inicio && endTime <= availability.hora_fin);
        if (!space || !hasAvailabilityWindow) {
          throw new BusinessRuleError(
            'conflict',
            'MENTOR_SLOT_UNAVAILABLE',
            'El horario seleccionado ya no está disponible',
          );
        }

        const conflict = await tx.mentoriaSolicitud.findFirst({
          where: {
            id_mentor: mentor.id,
            solicitud_fecha: date,
            estado: { in: ['PENDIENTE', 'ACEPTADO'] },
            solicitud_inicio: { lt: endTime },
            solicitud_fin: { gt: startTime },
          },
          select: { id: true },
        });
        if (conflict) {
          throw new BusinessRuleError(
            'conflict',
            'MENTOR_SLOT_UNAVAILABLE',
            'El horario seleccionado ya no está disponible',
          );
        }

        const row = await tx.mentoriaSolicitud.create({
          data: {
            id_mentor: mentor.id,
            id_usuario: userId,
            solicitud_fecha: date,
            solicitud_inicio: startTime,
            solicitud_fin: endTime,
            mensaje: input.message ?? null,
            estado: 'PENDIENTE',
            fecha_creacion: now,
            fecha_actualizacion: now,
          },
          select: requestSelect,
        });
        return toMentorshipRequest(row);
      },
      { timeout: 15000 },
    );
  }

  async listReceived(
    userId: string,
    query: MentorshipRequestQuery,
  ): Promise<MentorshipRequestPage> {
    const mentorId = await requireActiveMentorId(this.prisma, userId);
    const where = { id_mentor: mentorId, estado: query.status };
    const [rows, total] = await Promise.all([
      this.prisma.mentoriaSolicitud.findMany({
        where,
        select: requestSelect,
        orderBy: [{ fecha_creacion: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.mentoriaSolicitud.count({ where }),
    ]);
    return {
      items: rows.map(toMentorshipRequest),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async getReceived(userId: string, requestId: string): Promise<MentorshipRequest> {
    const mentorId = await requireActiveMentorId(this.prisma, userId);
    const row = await this.prisma.mentoriaSolicitud.findFirst({
      where: { id: requestId, id_mentor: mentorId },
      select: requestSelect,
    });
    if (!row) {
      throw new BusinessRuleError('missing', 'SOLICITUD_NO_ENCONTRADA', 'La solicitud no existe');
    }
    return toMentorshipRequest(row);
  }

  async respond(
    userId: string,
    requestId: string,
    status: Extract<MentorshipRequestStatus, 'ACEPTADO' | 'RECHAZADO'>,
    now: Date,
  ): Promise<MentorshipRequest> {
    return this.prisma.$transaction(
      async (tx) => {
        const mentorId = await requireActiveMentorId(tx, userId, true);
        const current = await tx.mentoriaSolicitud.findUnique({
          where: { id: requestId },
          select: { id: true, id_mentor: true, id_usuario: true, estado: true },
        });
        if (!current) {
          throw new BusinessRuleError(
            'missing',
            'SOLICITUD_NO_ENCONTRADA',
            'La solicitud no existe',
          );
        }
        if (current.id_mentor !== mentorId) {
          throw new BusinessRuleError(
            'forbidden',
            'SOLICITUD_NO_AUTORIZADA',
            'La solicitud no está dirigida a este mentor',
          );
        }
        if (current.estado !== 'PENDIENTE') {
          throw new BusinessRuleError(
            'conflict',
            'SOLICITUD_NO_PENDIENTE',
            'Esta solicitud ya no está pendiente',
          );
        }
        if (!current.id_usuario) {
          throw new BusinessRuleError(
            'invalid',
            'SOLICITANTE_NO_DISPONIBLE',
            'La solicitud no tiene un solicitante válido',
          );
        }
        const requester = await tx.usuario.findUnique({
          where: { usuario_id: current.id_usuario },
          select: { correo: true },
        });
        if (!requester?.correo) {
          throw new BusinessRuleError(
            'invalid',
            'SOLICITANTE_SIN_CORREO',
            'No se puede notificar al solicitante porque no tiene correo registrado',
          );
        }

        const responseDate = toDatabaseDate(now.toISOString().slice(0, 10));
        const updated = await tx.mentoriaSolicitud.updateMany({
          where: { id: requestId, id_mentor: mentorId, estado: 'PENDIENTE' },
          data: {
            estado: status,
            fecha_respuesta: responseDate,
            fecha_actualizacion: responseDate,
          },
        });
        if (updated.count !== 1) {
          throw new BusinessRuleError(
            'conflict',
            'SOLICITUD_NO_PENDIENTE',
            'Esta solicitud ya no está pendiente',
          );
        }

        if (status === 'ACEPTADO') {
          const existingConnection = await tx.conexion.findFirst({
            where: { id_mentoria_solicitud: requestId },
            select: { id: true },
          });
          if (!existingConnection) {
            await tx.conexion.create({
              data: {
                id_mentoria_solicitud: requestId,
                estado: 'ACTIVA',
                fecha_inicio: responseDate,
                fecha_creacion: responseDate,
                fecha_actualizacion: responseDate,
              },
            });
          }
        }

        const action = status === 'ACEPTADO' ? 'aceptada' : 'rechazada';
        const mail = this.security.seal({
          to: requester.correo,
          subject: `Respuesta a tu solicitud de mentoría: ${action}`,
          text: `Tu solicitud de mentoría ha sido ${action}. Ingresa a UMSSPIRA para consultar el estado y los detalles.`,
        });
        await tx.correoPendiente.create({
          data: { contenido: mail, expira_en: new Date(now.getTime() + 86400000) },
        });

        const row = await tx.mentoriaSolicitud.findUnique({
          where: { id: requestId },
          select: requestSelect,
        });
        if (!row) {
          throw new BusinessRuleError(
            'missing',
            'SOLICITUD_NO_ENCONTRADA',
            'La solicitud no existe',
          );
        }
        return toMentorshipRequest(row);
      },
      { timeout: 15000 },
    );
  }
}
