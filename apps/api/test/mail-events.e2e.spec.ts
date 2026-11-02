import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { AUTHENTICATOR } from '../src/shared/security/ports/authenticator.port';
import type { ActorContext } from '../src/shared/security/contexts/actor-context';
import { RATE_LIMITER } from '../src/modules/auth/application/ports/rate-limiter.port';
import { REGISTRATION_REPOSITORY } from '../src/modules/registrations/application/ports/registration-repository.port';
import { APPLICATIONS_REPOSITORY } from '../src/modules/registrations/application/ports/applications-repository.port';
import { MAIL_EVENTS_REPOSITORY } from '../src/modules/registrations/application/ports/mail-events-repository.port';
import { BusinessRuleError } from '../src/shared/errors/business-rule-error';

const careerId = randomUUID();
const actor: ActorContext = {
  id: randomUUID(),
  name: 'Administración',
  email: 'admin@example.com',
  role: 'administrador',
  permissions: ['solicitudes:read', 'solicitudes:review'],
  scopes: { companyIds: [], careerIds: [careerId], graduateId: null },
  credentialVersion: 1,
};

describe('Reproceso de correos fallidos: fronteras HTTP y permisos', () => {
  let app: INestApplication;
  const mailEvents = { requeueFailed: jest.fn() };
  const limiter = { consume: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(REGISTRATION_REPOSITORY)
      .useValue({})
      .overrideProvider(APPLICATIONS_REPOSITORY)
      .useValue({})
      .overrideProvider(MAIL_EVENTS_REPOSITORY)
      .useValue(mailEvents)
      .overrideProvider(RATE_LIMITER)
      .useValue(limiter)
      .overrideProvider(AUTHENTICATOR)
      .useValue({
        execute: async (access: string) => ({
          actor: access === 'admin' ? actor : { ...actor, permissions: [], role: 'empresa' },
          sessionId: randomUUID(),
        }),
      })
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureHttp(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    limiter.consume.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  afterAll(async () => app?.close());

  it('reprocesa por lote los correos fallidos del alcance del administrador', async () => {
    mailEvents.requeueFailed.mockResolvedValue({ requeued: 3, expired: 1 });
    const response = await request(app.getHttpServer())
      .post('/api/v1/mail-events/retry-failed')
      .set('Authorization', 'Bearer admin')
      .expect(200);
    expect(response.body.data).toEqual({ requeued: 3, expired: 1 });
    expect(mailEvents.requeueFailed).toHaveBeenCalledWith(
      expect.objectContaining({ id: actor.id }),
    );
  });

  it('reintenta un correo fallido por su identificador', async () => {
    const id = randomUUID();
    mailEvents.requeueFailed.mockResolvedValue({ requeued: 1, expired: 0 });
    const response = await request(app.getHttpServer())
      .post('/api/v1/mail-events/' + id + '/retry')
      .set('Authorization', 'Bearer admin')
      .expect(200);
    expect(response.body.data).toEqual({ requeued: 1, expired: 0 });
    expect(mailEvents.requeueFailed).toHaveBeenCalledWith(
      expect.objectContaining({ id: actor.id }),
      id,
    );
  });

  it('rechaza un identificador que no es UUID sin consultar la base', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/mail-events/no-es-uuid/retry')
      .set('Authorization', 'Bearer admin')
      .expect(400);
    expect(mailEvents.requeueFailed).not.toHaveBeenCalled();
  });

  it('responde 404 cuando el correo no está fallido o no es de sus carreras', async () => {
    mailEvents.requeueFailed.mockRejectedValue(
      new BusinessRuleError('missing', 'MAIL_EVENT_NOT_FOUND', 'No hay un correo fallido'),
    );
    await request(app.getHttpServer())
      .post('/api/v1/mail-events/' + randomUUID() + '/retry')
      .set('Authorization', 'Bearer admin')
      .expect(404);
  });

  it('exige el permiso de revisión para reprocesar correos', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/mail-events/retry-failed')
      .set('Authorization', 'Bearer empresa')
      .expect(403);
    expect(mailEvents.requeueFailed).not.toHaveBeenCalled();
  });
});