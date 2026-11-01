import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthenticationGuard } from '../../../../shared/http/auth/guards/authentication.guard';
import { PermissionsGuard } from '../../../../shared/http/auth/guards/permissions.guard';
import { AUTHENTICATOR } from '../../../../shared/security/ports/authenticator.port';
import { ErrorHandlerFilter } from '../../../../shared/http/filters/error-handler.filter';
import { RATE_LIMITER } from '../../../auth/application/ports/rate-limiter.port';
import { ChatRateLimitGuard } from '../guards/chat-rate-limit.guard';
import { SendMessageController } from './send-message.controller';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { StartConversationController } from './start-conversation.controller';
import { StartConversationUseCase } from '../../application/use-cases/start-conversation.use-case';

describe('Contrato HTTP del chat', () => {
  let app: INestApplication;
  const execute = jest.fn();
  const id = '00000000-0000-4000-8000-000000000001';
  const auth = {
    execute: jest.fn(async () => ({ actor: { id, permissions: ['user:self:read'] } })),
  };
  const limiter = { consume: jest.fn(async () => ({ allowed: true, retryAfterSeconds: 1 })) };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SendMessageController, StartConversationController],
      providers: [
        { provide: SendMessageUseCase, useValue: { execute } },
        { provide: StartConversationUseCase, useValue: { execute } },
        { provide: AUTHENTICATOR, useValue: auth },
        { provide: RATE_LIMITER, useValue: limiter },
        ChatRateLimitGuard,
        { provide: APP_GUARD, useClass: AuthenticationGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new ErrorHandlerFilter());
    await app.init();
  });
  beforeEach(() => {
    execute.mockReset();
    limiter.consume.mockResolvedValue({ allowed: true, retryAfterSeconds: 1 });
  });
  afterAll(async () => {
    await app.close();
  });
  const message = { clientId: '00000000-0000-4000-8000-000000000002', content: 'Hola' };
  it('exige sesión antes de procesar el mensaje', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${id}/messages`)
      .send(message)
      .expect(401);
    expect(execute).not.toHaveBeenCalled();
  });
  it('rechaza IDs inválidos, payloads extensos y remitentes inyectados', async () => {
    for (const [conversationId, body] of [
      ['invalido', message],
      [id, { ...message, content: 'x'.repeat(501) }],
      [id, { ...message, senderId: id }],
    ]) {
      await request(app.getHttpServer())
        .post(`/api/v1/chat/conversations/${conversationId}/messages`)
        .set('Authorization', 'Bearer test')
        .send(body)
        .expect(400);
    }
    expect(execute).not.toHaveBeenCalled();
  });
  it('deriva el remitente de la sesión y publica un contrato sin filas de Prisma', async () => {
    execute.mockResolvedValue({
      id: 'm1',
      conversationId: id,
      senderId: id,
      clientId: message.clientId,
      content: 'Hola',
      sentAt: '2026-11-01T12:00:00.000Z',
      editedAt: null,
      deletedAt: null,
      internal: 'privado',
    });
    const response = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${id}/messages`)
      .set('Authorization', 'Bearer test')
      .send(message)
      .expect(201);
    expect(execute).toHaveBeenCalledWith(id, id, message);
    expect(response.body.data.content).toBe('Hola');
    expect(response.body.data.internal).toBeUndefined();
  });
  it('limita nuevos contactos y mensajes por usuario', async () => {
    limiter.consume.mockResolvedValue({ allowed: false, retryAfterSeconds: 10 });
    await request(app.getHttpServer())
      .post('/api/v1/chat/conversations')
      .set('Authorization', 'Bearer test')
      .send({ ...message, recipientId: message.clientId })
      .expect(429);
    expect(execute).not.toHaveBeenCalled();
  });
  it('el endpoint de simulación ya no existe', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${id}/simulate-reply`)
      .set('Authorization', 'Bearer test')
      .expect(404);
  });
});
