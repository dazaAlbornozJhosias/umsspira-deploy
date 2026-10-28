import { Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  AUTHENTICATOR,
  type Authenticator,
} from '../../shared/security/ports/authenticator.port';
import { ACCESS_COOKIE } from '../../shared/http/auth/cookies/request-cookies';
import { ChatService } from './chat.service';

export interface SendMessagePayload {
  conversationId: string;
  content: string;
}

export interface SendMessageAck {
  success: boolean;
  messageId?: string;
  error?: string;
}

// El CORS del socket lo define CorsIoAdapter (main.ts) con la variable CORS_ORIGINS.
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(AUTHENTICATOR) private readonly auth: Authenticator,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {return this.reject(client, 'Sin token');}

      const context = await this.auth.execute(token);
      const userId = context.actor?.id;
      if (!userId) {return this.reject(client, 'Sesión sin usuario');}

      client.data.userId = userId;
      client.join(`user_${userId}`);
      client.emit('chat:ready');
      this.logger.log(`Conectado: ${client.id} (user ${userId})`);
    } catch {
      this.reject(client, 'Token inválido');
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Desconectado: ${client.id}`);
  }

  @SubscribeMessage('chat:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<SendMessageAck> {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      client.emit('chat:unauthorized');
      return { success: false, error: 'No autenticado' };
    }
    try {
      const message = await this.chatService.saveMessage({
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content,
      });

      const participantIds =
        await this.chatService.getConversationParticipantIds(
          payload.conversationId,
          userId,
        );

      const rooms = participantIds.map((id) => `user_${id}`);

      if (rooms.length > 0) {
        this.server.to(rooms).emit('chat:new_message', message);
      }

      return { success: true, messageId: message.id };
    } catch (error) {
      this.logger.error('Error al enviar mensaje', error);
      return { success: false, error: 'No se pudo enviar el mensaje' };
    }
  }

  private reject(client: Socket, reason: string): void {
    this.logger.warn(`Rechazado: ${reason} (${client.id})`);
    client.emit('chat:unauthorized');
    client.disconnect(true);
  }

  private extractToken(client: Socket): string | undefined {
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) {return fromAuth;}

    const raw = client.handshake.headers.cookie
      ?.split(';')
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${ACCESS_COOKIE}=`))
      ?.slice(ACCESS_COOKIE.length + 1);

    if (!raw) {return undefined;}
    try {
      return decodeURIComponent(raw);
    } catch {
      return undefined;
    }
  }
}