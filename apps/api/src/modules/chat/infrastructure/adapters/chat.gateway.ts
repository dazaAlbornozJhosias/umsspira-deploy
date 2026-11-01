import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import type { Environment } from '../../../../config/environment';
import {
  AUTHENTICATOR,
  type Authenticator,
} from '../../../../shared/security/ports/authenticator.port';
import type { ChatEvents } from '../../application/ports/chat-events.port';

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, ChatEvents
{
  @WebSocketServer() private server!: Namespace;
  private readonly logger = new Logger(ChatGateway.name);
  private readonly sessions = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    @Inject(AUTHENTICATOR) private readonly auth: Authenticator,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  afterInit(server: Namespace): void {
    server.use(async (client, next) => {
      try {
        const origin = client.handshake.headers.origin;
        if (!origin || !this.config.get('CORS_ORIGINS', { infer: true }).includes(origin)) {
          throw new Error('origin');
        }
        const token: unknown = client.handshake.auth?.token;
        if (typeof token !== 'string' || token.length > 8192) {
          throw new Error('token');
        }
        const context = await this.auth.execute(token);
        client.data.userId = context.actor.id;
        next();
      } catch {
        next(
          Object.assign(new Error('No fue posible autenticar el chat'), {
            data: { code: 'UNAUTHENTICATED' },
          }),
        );
      }
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    await client.join(`user:${client.data.userId}`);
    client.emit('chat:ready');
    // Las escrituras se autentican por HTTP; una suscripción revocada se cierra también.
    const timer = setInterval(() => {
      void this.auth.execute(client.handshake.auth.token).catch(() => {
        client.emit('chat:session_expired');
        client.disconnect(true);
      });
    }, 30_000);
    timer.unref();
    this.sessions.set(client.id, timer);
  }

  handleDisconnect(client: Socket): void {
    clearInterval(this.sessions.get(client.id));
    this.sessions.delete(client.id);
  }

  changed(conversationId: string, participantIds: string[]): void {
    try {
      this.server
        ?.to(participantIds.map((id) => `user:${id}`))
        .emit('chat:changed', { conversationId });
    } catch {
      // Un fallo de difusión no convierte una escritura confirmada en un envío fallido.
      this.logger.warn('No fue posible publicar una actualización de chat');
    }
  }
}
