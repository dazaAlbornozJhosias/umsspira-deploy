import { Injectable } from '@nestjs/common';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import { Prisma } from '../../../../generated/prisma/client';
import type {
  ChatRepository,
  ChatTransaction,
  MessageInput,
} from '../../application/ports/chat-repository.port';
import { assertParticipant, assertSameDelivery } from '../../domain/policies/conversation.policy';
import {
  conversationInclude,
  messageSelect,
  toConversation,
  toMessage,
  toSummary,
} from '../translators/chat.translator';

@Injectable()
export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async conversation(db: Prisma.TransactionClient, id: string, actorId: string) {
    const row = await db.conversacion.findFirst({
      where: {
        id,
        tipo: 'directo',
        direct_key: { not: null },
        participante_conversacion_registros: { some: { usuario_id: actorId } },
      },
      include: conversationInclude,
    });
    if (!row) {
      throw new BusinessRuleError('missing', 'CHAT_NOT_FOUND', 'No se encontró la conversación');
    }
    assertParticipant(toConversation(row), actorId);
    return row;
  }

  async start(actorId: string, recipientId: string, input: MessageInput) {
    const key = [actorId, recipientId].sort().join(':');
    return this.prisma.$transaction(async (db) => {
      // La pareja tiene un único bloqueo incluso si ambos usuarios escriben a la vez.
      await db.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
      const existing = await db.conversacion.findUnique({
        where: { direct_key: key },
        include: conversationInclude,
      });
      if (existing) {
        const delivery = await db.mensaje.findUnique({
          where: { emisor_id_client_id: { emisor_id: actorId, client_id: input.clientId } },
          select: messageSelect,
        });
        if (delivery) {
          assertSameDelivery(toMessage(delivery), existing.id, input.content);
        }
        return { conversation: toConversation(existing), created: false };
      }
      const reused = await db.mensaje.findUnique({
        where: { emisor_id_client_id: { emisor_id: actorId, client_id: input.clientId } },
        select: { id: true },
      });
      if (reused) {
        throw new BusinessRuleError(
          'conflict',
          'CHAT_CLIENT_ID_REUSED',
          'El identificador de envío ya fue utilizado',
        );
      }
      const now = new Date();
      const row = await db.conversacion.create({
        data: {
          tipo: 'directo',
          direct_key: key,
          estado_conversacion: 'PENDIENTE',
          creado_por: actorId,
          fecha_creacion: now,
          fecha_actualizacion: now,
          participante_conversacion_registros: {
            create: [{ usuario_id: actorId }, { usuario_id: recipientId }],
          },
          mensaje_registros: {
            create: {
              emisor_id: actorId,
              client_id: input.clientId,
              contenido: input.content,
              fecha_mensaje: now,
              tipo_contenido: 'texto',
              estado_envio: 'enviado',
            },
          },
        },
        include: conversationInclude,
      });
      return { conversation: toConversation(row), created: true };
    });
  }

  async get(id: string, actorId: string) {
    const row = await this.conversation(this.prisma, id, actorId);
    const readAt = row.participante_conversacion_registros.find(
      (participant) => participant.usuario_id === actorId,
    )?.ultima_lectura;
    const count = await this.prisma.mensaje.count({
      where: {
        id_conversacion: id,
        emisor_id: { not: actorId },
        eliminado_en: null,
        ...(readAt ? { fecha_mensaje: { gt: readAt } } : {}),
      },
    });
    return toSummary(row, actorId, count);
  }

  async attachment(id: string, actorId: string, messageId: string) {
    await this.conversation(this.prisma, id, actorId);
    const row = await this.prisma.mensaje.findFirst({
      where: {
        id: messageId,
        id_conversacion: id,
        eliminado_en: null,
        archivo_bytes: { not: null },
      },
      select: { archivo_nombre: true, archivo_mime: true, archivo_bytes: true },
    });
    if (!row?.archivo_bytes) {
      throw new BusinessRuleError(
        'missing',
        'CHAT_ATTACHMENT_NOT_FOUND',
        'El archivo ya no está disponible',
      );
    }
    return { name: row.archivo_nombre!, mime: row.archivo_mime!, bytes: row.archivo_bytes };
  }

  async list(actorId: string, page: number) {
    const rows = await this.prisma.conversacion.findMany({
      where: {
        tipo: 'directo',
        direct_key: { not: null },
        participante_conversacion_registros: { some: { usuario_id: actorId } },
      },
      include: conversationInclude,
      orderBy: [{ fecha_actualizacion: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * 20,
      take: 21,
    });
    const counts = rows.length
      ? await this.prisma.$queryRaw<{ id: string; count: number }[]>(Prisma.sql`
      SELECT p.conversacion_id AS id, count(m.id)::int AS count
      FROM participante_conversacion p JOIN mensaje m ON m.id_conversacion = p.conversacion_id
      WHERE p.usuario_id = ${actorId}::uuid AND p.conversacion_id IN (${Prisma.join(rows.map((row) => Prisma.sql`${row.id}::uuid`))})
        AND m.emisor_id <> ${actorId}::uuid AND m.eliminado_en IS NULL
        AND (p.ultima_lectura IS NULL OR m.fecha_mensaje > p.ultima_lectura)
      GROUP BY p.conversacion_id
    `)
      : [];
    const unread = new Map(counts.map((entry) => [entry.id, entry.count]));
    return {
      items: rows.slice(0, 20).map((row) => toSummary(row, actorId, unread.get(row.id) ?? 0)),
      hasMore: rows.length > 20,
    };
  }

  async unread(actorId: string) {
    const rows = await this.prisma.$queryRaw<{ id: string; count: number }[]>`
      SELECT c.id, count(m.id)::int AS count
      FROM conversacion c JOIN participante_conversacion p ON p.conversacion_id = c.id
      JOIN mensaje m ON m.id_conversacion = c.id
      WHERE p.usuario_id = ${actorId}::uuid AND c.tipo = 'directo' AND c.direct_key IS NOT NULL
        AND c.estado_conversacion <> 'RECHAZADO' AND m.emisor_id <> ${actorId}::uuid AND m.eliminado_en IS NULL
        AND (p.ultima_lectura IS NULL OR m.fecha_mensaje > p.ultima_lectura)
      GROUP BY c.id ORDER BY c.fecha_actualizacion DESC, c.id DESC
    `;
    const ids = rows.slice(0, 5).map((row) => row.id);
    const conversations = await this.prisma.conversacion.findMany({
      where: { id: { in: ids } },
      include: conversationInclude,
    });
    const byId = new Map(conversations.map((row) => [row.id, row]));
    return {
      total: rows.reduce((sum, row) => sum + row.count, 0),
      conversations: rows
        .slice(0, 5)
        .flatMap((row) =>
          byId.has(row.id) ? [toSummary(byId.get(row.id)!, actorId, row.count)] : [],
        ),
    };
  }

  async messages(id: string, actorId: string, before?: string) {
    await this.conversation(this.prisma, id, actorId);
    const cursor = before
      ? await this.prisma.mensaje.findFirst({
          where: { id: before, id_conversacion: id },
          select: messageSelect,
        })
      : null;
    if (before && !cursor) {
      throw new BusinessRuleError(
        'invalid',
        'CHAT_INVALID_CURSOR',
        'El cursor no pertenece a esta conversación',
      );
    }
    const rows = await this.prisma.mensaje.findMany({
      where: {
        id_conversacion: id,
        ...(cursor
          ? {
              OR: [
                { fecha_mensaje: { lt: cursor.fecha_mensaje! } },
                { fecha_mensaje: cursor.fecha_mensaje, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      select: messageSelect,
      orderBy: [{ fecha_mensaje: 'desc' }, { id: 'desc' }],
      take: 31,
    });
    const items = rows.slice(0, 30).reverse().map(toMessage);
    return { items, nextCursor: rows.length > 30 ? items[0].id : null };
  }

  async transaction<T>(
    id: string,
    actorId: string,
    work: (tx: ChatTransaction) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (db) => {
        await db.$queryRaw`SELECT id FROM conversacion WHERE id = ${id}::uuid FOR UPDATE`;
        const row = await this.conversation(db, id, actorId);
        const now = new Date(Math.max(Date.now(), (row.fecha_actualizacion?.getTime() ?? 0) + 1));
        const touch = () =>
          db.conversacion.update({ where: { id }, data: { fecha_actualizacion: now } });
        const tx: ChatTransaction = {
          conversation: toConversation(row),
          findMessage: async (messageId) => {
            const message = await db.mensaje.findFirst({
              where: { id: messageId, id_conversacion: id },
              select: messageSelect,
            });
            return message ? toMessage(message) : null;
          },
          findDelivery: async (clientId) => {
            const message = await db.mensaje.findUnique({
              where: { emisor_id_client_id: { emisor_id: actorId, client_id: clientId } },
              select: messageSelect,
            });
            return message ? toMessage(message) : null;
          },
          append: async (input) => {
            const message = await db.mensaje.create({
              data: {
                id_conversacion: id,
                emisor_id: actorId,
                client_id: input.clientId,
                contenido: input.content,
                fecha_mensaje: now,
                tipo_contenido: 'texto',
                estado_envio: 'enviado',
                ...(input.attachment
                  ? {
                      tipo_contenido: 'archivo',
                      archivo_nombre: input.attachment.name,
                      archivo_mime: input.attachment.mime,
                      archivo_bytes: new Uint8Array(input.attachment.bytes),
                      archivo_tamano: input.attachment.size,
                    }
                  : {}),
              },
              select: messageSelect,
            });
            await touch();
            return toMessage(message);
          },
          edit: async (messageId, content) => {
            const message = await db.mensaje.update({
              where: { id: messageId },
              data: { contenido: content, editado_en: now },
              select: messageSelect,
            });
            await touch();
            return toMessage(message);
          },
          remove: async (messageId) => {
            const message = await db.mensaje.update({
              where: { id: messageId },
              data: {
                contenido: null,
                archivo_url: null,
                archivo_bytes: null,
                archivo_nombre: null,
                archivo_mime: null,
                archivo_tamano: null,
                eliminado_en: now,
              },
              select: messageSelect,
            });
            await touch();
            return toMessage(message);
          },
          respond: async (status) => {
            await db.conversacion.update({
              where: { id },
              data: { estado_conversacion: status, fecha_actualizacion: now },
            });
            return { ...toConversation(row), status };
          },
          markRead: async (message) => {
            const sentAt = new Date(message.sentAt);
            await db.participanteConversacion.updateMany({
              where: {
                conversacion_id: id,
                usuario_id: actorId,
                OR: [{ ultima_lectura: null }, { ultima_lectura: { lt: sentAt } }],
              },
              data: { ultima_lectura: sentAt },
            });
          },
        };
        return work(tx);
      },
      { timeout: 10000 },
    );
  }
}
