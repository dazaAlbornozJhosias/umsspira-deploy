import type { Prisma } from '../../../../generated/prisma/client';
import type {
  Conversation,
  ConversationStatus,
  ConversationSummary,
  Message,
} from '../../domain/entities/conversation';

export const messageSelect = {
  archivo_nombre: true,
  archivo_mime: true,
  archivo_tamano: true,
  id: true,
  id_conversacion: true,
  emisor_id: true,
  client_id: true,
  contenido: true,
  fecha_mensaje: true,
  editado_en: true,
  eliminado_en: true,
} satisfies Prisma.MensajeSelect;

export const conversationInclude = {
  participante_conversacion_registros: {
    select: {
      usuario_id: true,
      ultima_lectura: true,
      usuario: { select: { usuario_id: true, nombre: true, rol: true } },
    },
  },
  mensaje_registros: {
    select: messageSelect,
    orderBy: [{ fecha_mensaje: 'desc' }, { id: 'desc' }],
    take: 1,
  },
} satisfies Prisma.ConversacionInclude;

type ConversationRow = Prisma.ConversacionGetPayload<{ include: typeof conversationInclude }>;
type MessageRow = Prisma.MensajeGetPayload<{ select: typeof messageSelect }>;

export function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.id_conversacion!,
    senderId: row.emisor_id!,
    clientId: row.client_id,
    content: row.eliminado_en ? '' : (row.contenido ?? ''),
    sentAt: row.fecha_mensaje!.toISOString(),
    editedAt: row.editado_en?.toISOString() ?? null,
    deletedAt: row.eliminado_en?.toISOString() ?? null,
    attachment:
      !row.eliminado_en && row.archivo_nombre
        ? { name: row.archivo_nombre, mime: row.archivo_mime!, size: row.archivo_tamano! }
        : null,
  };
}

export function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    status: row.estado_conversacion as ConversationStatus,
    requesterId: row.creado_por!,
    participantIds: row.participante_conversacion_registros.flatMap((participant) =>
      participant.usuario_id ? [participant.usuario_id] : [],
    ),
  };
}

export function toSummary(
  row: ConversationRow,
  actorId: string,
  unreadCount: number,
): ConversationSummary {
  const other = row.participante_conversacion_registros.find(
    (participant) => participant.usuario_id !== actorId,
  )?.usuario;
  return {
    ...toConversation(row),
    otherUser: {
      id: other?.usuario_id ?? '',
      name: other?.nombre ?? 'Usuario',
      role: other?.rol ?? '',
    },
    lastMessage: row.mensaje_registros[0] ? toMessage(row.mensaje_registros[0]) : null,
    unreadCount,
    lastActivityAt: (row.fecha_actualizacion ?? row.fecha_creacion)!.toISOString(),
  };
}
