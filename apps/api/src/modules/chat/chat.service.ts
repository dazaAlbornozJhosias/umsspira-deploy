// apps/api/src/modules/chat/chat.service.ts
// apps/api/src/modules/chat/chat.service.ts
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getFirstUser() {
    return this.prisma.usuario.findFirst();
  }

  async findOrCreateDirectConversation(
    actorId: string,
    targetUserId: string,
    status: string = 'ACEPTADO',
  ) {
    if (!targetUserId) {
      throw new BadRequestException('targetUserId es requerido');
    }

    const target = await this.prisma.usuario.findUnique({
      where: { usuario_id: targetUserId },
    });
    if (!target) {
      throw new BadRequestException('El usuario destino no existe');
    }

    if (!actorId) {
      throw new ForbiddenException('Debes iniciar sesión');
    }

    if (actorId === targetUserId) {
      throw new BadRequestException(
        'No puedes iniciar una conversación contigo mismo',
      );
    }

const actor = await this.prisma.usuario.findUnique({
  where: { usuario_id: actorId },
  select: { usuario_id: true },
});

if (!actor) {
  throw new ForbiddenException('El usuario autenticado no existe');
}

const finalActorId = actorId;

    const existing = await this.prisma.conversacion.findFirst({
      where: {
        tipo: 'directo',
        AND: [
          { participante_conversacion_registros: { some: { usuario_id: finalActorId } } },
          { participante_conversacion_registros: { some: { usuario_id: targetUserId } } },
        ],
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversacion.create({
      data: {
        tipo: 'directo',
        estado_conversacion: status,
        creado_por: finalActorId,
        participante_conversacion_registros: {
          create: [{ usuario_id: finalActorId }, { usuario_id: targetUserId }],
        },
      },
    });
  }

  async getUserConversations(actorId: string) {

    const firstUser = await this.prisma.usuario.findFirst();
    if (!firstUser) {
      return [];
    }

    const conversations = await this.prisma.conversacion.findMany({
      where: {
        participante_conversacion_registros: {
          some: { usuario_id: actorId },
        },
      },
      include: {
        participante_conversacion_registros: { include: { usuario: true } },
        mensaje_registros: { orderBy: { fecha_mensaje: 'desc' } },
      },
      orderBy: { fecha_actualizacion: 'desc' },
    });

    return conversations
      .map((conv) => {
        const otherParticipant = conv.participante_conversacion_registros.find(
          (p) => p.usuario_id !== actorId,
        );

        // mensaje_registros ya viene ordenado del más nuevo al más viejo
        const last = conv.mensaje_registros[0];

        const unreadCount = conv.mensaje_registros.filter(
          (m) => m.emisor_id !== actorId && m.estado_envio !== 'leido',
        ).length;

        return {
          id: conv.id,
          updatedAt: conv.fecha_actualizacion,
          unreadCount,
          isUnread: unreadCount > 0,
          estado: conv.estado_conversacion || 'ACEPTADO',
          otherUser: {
            id: otherParticipant?.usuario?.usuario_id || 'unknown',
            name: otherParticipant?.usuario?.nombre || 'Usuario',
            role: otherParticipant?.usuario?.rol || 'Desconocido',
          },
          lastMessage: last
            ? {
                content: last.contenido ?? '',
                sentAt: last.fecha_mensaje,
                senderId: last.emisor_id,
              }
            : null,
          lastActivityAt:
            last?.fecha_mensaje ?? conv.fecha_actualizacion ?? conv.fecha_creacion ?? null,
        };
      })
      .sort(
        (a, b) =>
          (b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0) -
          (a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0),
      );
  }

  async getAvailableUsersToChat() {
    return this.prisma.usuario.findMany({
      take: 100,
      select: { usuario_id: true, nombre: true, rol: true, correo: true },
    });
  }

  
  
  async getMessages(
    conversationId: string,
    limit = 30,
    beforeId?: string,
  ) {
    const pageSize = Math.min(Math.max(Number(limit) || 30, 1), 100);

    const cursorMessage = beforeId
      ? await this.prisma.mensaje.findFirst({
          where: {
            id: beforeId,
            id_conversacion: conversationId,
          },
          select: {
            id: true,
          },
        })
      : null;

    if (beforeId && !cursorMessage) {
      throw new BadRequestException(
        'El mensaje de referencia no existe en esta conversación',
      );
    }

    
    const messages = await this.prisma.mensaje.findMany({
      where: {
        id_conversacion: conversationId,
      },
      ...(cursorMessage
        ? {
            cursor: { id: cursorMessage.id },
            skip: 1,
          }
        : {}),
      orderBy: [
        { fecha_mensaje: { sort: 'desc', nulls: 'last' } },
        { id: 'desc' },
      ],
      take: pageSize + 1,
    });

    const hasMore = messages.length > pageSize;
    const page = messages.slice(0, pageSize).reverse();

    return {
      messages: page,
      hasMore,
      nextCursor: hasMore ? page[0]?.id ?? null : null,
    };
  }


  async assertParticipant(conversationId: string, userId: string): Promise<void> {
    const participant = await this.prisma.participanteConversacion.findFirst({
      where: { conversacion_id: conversationId, usuario_id: userId },
      select: { id: true },
    });
    if (!participant) {
      throw new ForbiddenException('No participas en esta conversación');
    }
  }

  async saveMessage(payload: { conversationId: string; senderId: string; content: string }) {
    const content = payload.content?.trim();
    if (!content) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }
    await this.assertParticipant(payload.conversationId, payload.senderId);

    return this.prisma.mensaje.create({
      data: {
        id_conversacion: payload.conversationId,
        emisor_id: payload.senderId,
        contenido: content,
        tipo_contenido: 'texto',
        estado_envio: 'enviado',
        fecha_mensaje: new Date(),
      },
    });
  }

  async simulateReply(conversationId: string, content: string) {
    const conv = await this.prisma.conversacion.findUnique({
      where: { id: conversationId },
      include: { participante_conversacion_registros: true },
    });
    if (!conv || conv.participante_conversacion_registros.length < 2) {
      return;
    }

    const otherUser = conv.participante_conversacion_registros.find(
      (p) => p.usuario_id !== conv.creado_por,
    );
    if (!otherUser) {
      return;
    }

    return this.prisma.mensaje.create({
      data: {
        id_conversacion: conversationId,
        emisor_id: otherUser.usuario_id,
        contenido: content,
        tipo_contenido: 'texto',
        estado_envio: 'enviado',
        fecha_mensaje: new Date(),
      },
    });
  }

  async markAsRead(conversationId: string, actorId: string) {
    return this.prisma.mensaje.updateMany({
      where: {
        id_conversacion: conversationId,
        emisor_id: { not: actorId },
        estado_envio: { not: 'leido' },
      },
      data: { estado_envio: 'leido' },
    });
  }

  async getConversationParticipantIds(
      conversationId: string,
      actorId: string,): Promise<string[]> {
      await this.assertParticipant(conversationId, actorId);

      const participants =
        await this.prisma.participanteConversacion.findMany({
          where: { conversacion_id: conversationId },
          select: { usuario_id: true },
        });

      return participants
        .map((participant) => participant.usuario_id)
        .filter((id): id is string => typeof id === 'string');
    }
}