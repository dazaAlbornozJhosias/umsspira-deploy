import type { Evento, Prisma } from '../../../../generated/prisma/client';
import type { Event, EventStatus } from '../../domain/entities/event';

export const eventInclude = {
  usuario: { select: { nombre: true } },
  _count: {
    select: {
      inscripcion_evento_registros: { where: { estado: 'CONFIRMADA' } },
    },
  },
} satisfies Prisma.EventoInclude;

type EventWithDetails = Prisma.EventoGetPayload<{ include: typeof eventInclude }>;
type EventRow = Evento | EventWithDetails;

export function toEvent(row: EventRow): Event {
  const status = row.estado?.toUpperCase();
  if (
    !row.id_usuario ||
    !row.titulo ||
    !row.fecha_inicio ||
    !row.fecha_fin ||
    !row.fecha_creacion ||
    !row.cupo_maximo ||
    !['BORRADOR', 'PUBLICADO', 'CANCELADO'].includes(status ?? '')
  ) {
    throw new Error('Evento persistido incompleto');
  }
  return {
    id: row.id,
    ownerId: row.id_usuario,
    title: row.titulo,
    description: row.descripcion,
    startDate: row.fecha_inicio,
    endDate: row.fecha_fin,
    maxCapacity: row.cupo_maximo,
    currentCapacity: '_count' in row
      ? row._count.inscripcion_evento_registros
      : undefined,
    location: row.ubicacion,
    coverId: row.id_portada,
    status: status as EventStatus,
    creatorName: 'usuario' in row ? row.usuario?.nombre ?? null : null,
    createdAt: row.fecha_creacion,
  };
}
