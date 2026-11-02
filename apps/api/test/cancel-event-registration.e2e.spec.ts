/// <reference types="jest" />
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { EVENTS_REPOSITORY } from '../src/modules/events/application/ports/events-repository.port';
import { CancelEventRegistrationController } from '../src/modules/events/http/controllers/cancel-event-registration.controller';
import { eventsProviders } from '../src/modules/events/infrastructure/providers/events.providers';
import { BusinessRuleError } from '../src/shared/errors/business-rule-error';
import { AuthenticationGuard } from '../src/shared/http/auth/guards/authentication.guard';
import { PermissionsGuard } from '../src/shared/http/auth/guards/permissions.guard';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import type { ActorContext } from '../src/shared/security/contexts/actor-context';
import { AccessError } from '../src/shared/security/errors/access-error';
import { AUTHENTICATOR } from '../src/shared/security/ports/authenticator.port';
import { GenerateEventPassService } from '../src/modules/events/application/generate-event-pass.service';

const registrationId = randomUUID();
const graduate: ActorContext = {
  id: randomUUID(),
  email: 'titulado@example.com',
  name: 'Titulado',
  role: 'titulado',
  credentialVersion: 1,
  permissions: [],
  scopes: { graduateId: randomUUID(), companyIds: [], careerIds: [] },
};

describe('Endpoint de cancelación de inscripción', () => {
  let app: INestApplication;
  const repository = { cancelRegistration: jest.fn() };
  const path = (id: string = registrationId) => `/api/v1/events/registrations/${id}/cancel`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CancelEventRegistrationController],
      providers: [
        ...eventsProviders,
        { provide: PrismaService, useValue: {} },
        { provide: GenerateEventPassService, useValue: {} },
        {
          provide: ConfigService,
          useValue: new ConfigService({ CORS_ORIGINS: ['http://localhost:3001'] }),
        },
        {
          provide: AUTHENTICATOR,
          useValue: {
            execute: async (token: string) => {
              if (!['titulado', 'administrador'].includes(token)) {
                throw new AccessError('UNAUTHENTICATED');
              }
              return {
                actor: token === 'titulado' ? graduate : { ...graduate, role: 'administrador' },
                sessionId: randomUUID(),
              };
            },
          },
        },
        { provide: APP_GUARD, useClass: AuthenticationGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    })
      .overrideProvider(EVENTS_REPOSITORY)
      .useValue(repository)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureHttp(app);
    await app.init();
  });

  beforeEach(() => {
    repository.cancelRegistration.mockReset().mockResolvedValue(undefined);
  });

  afterAll(async () => app?.close());

  it('responde 204 y utiliza la identidad del servidor y la fecha actual', async () => {
    const start = Date.now();
    const response = await request(app.getHttpServer())
      .patch(path())
      .set('Authorization', 'Bearer titulado')
      .set('x-user-id', randomUUID())
      .send({ userId: randomUUID() })
      .expect(204);
    expect(response.text).toBe('');
    expect(repository.cancelRegistration).toHaveBeenCalledTimes(1);
    expect(repository.cancelRegistration).toHaveBeenCalledWith(
      graduate.id,
      registrationId,
      expect.any(Date),
    );
    const calledAt = repository.cancelRegistration.mock.calls[0][2] as Date;
    expect(calledAt.getTime()).toBeGreaterThanOrEqual(start);
    expect(calledAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('rechaza solicitudes sin sesión antes de llamar al repositorio', async () => {
    const response = await request(app.getHttpServer()).patch(path()).expect(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(repository.cancelRegistration).not.toHaveBeenCalled();
  });

  it('rechaza una sesión inválida', async () => {
    await request(app.getHttpServer())
      .patch(path())
      .set('Authorization', 'Bearer vencido')
      .expect(401);
    expect(repository.cancelRegistration).not.toHaveBeenCalled();
  });

  it('exige el rol Titulado', async () => {
    await request(app.getHttpServer())
      .patch(path())
      .set('Authorization', 'Bearer administrador')
      .expect(403);
    expect(repository.cancelRegistration).not.toHaveBeenCalled();
  });

  it('valida el UUID antes de llamar al repositorio', async () => {
    await request(app.getHttpServer())
      .patch(path('invalido'))
      .set('Authorization', 'Bearer titulado')
      .expect(400);
    expect(repository.cancelRegistration).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', 'EVENT_REGISTRATION_NOT_FOUND', 404],
    ['conflict', 'EVENT_REGISTRATION_NOT_CONFIRMED', 409],
    ['conflict', 'EVENT_REGISTRATION_NOT_CANCELLABLE', 409],
  ] as ['missing' | 'conflict', string, number][])(`traduce el error %s / %s a HTTP %i`, async (reason, code, status) => {
    repository.cancelRegistration.mockRejectedValue(
      new BusinessRuleError(reason, code, 'No disponible'),
    );
    const response = await request(app.getHttpServer())
      .patch(path())
      .set('Authorization', 'Bearer titulado')
      .expect(status);
    expect(response.body).toEqual({ error: { code, message: 'No disponible' } });
  });

  it('oculta los detalles internos de un fallo de persistencia', async () => {
    repository.cancelRegistration.mockRejectedValue(new Error('DETALLE_INTERNO_DE_PERSISTENCIA'));
    const response = await request(app.getHttpServer())
      .patch(path())
      .set('Authorization', 'Bearer titulado')
      .expect(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('DETALLE_INTERNO_DE_PERSISTENCIA');
  });
});