import { Controller, HttpCode, Inject, INestApplication, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  EVENTS_REPOSITORY,
  type EventsRepository,
} from '../src/modules/events/application/ports/events-repository.port';
import { PrismaEventsRepository } from '../src/modules/events/infrastructure/repositories/prisma-events.repository';
import { CurrentActor } from '../src/shared/http/auth/decorators/current-actor.decorator';
import { Roles } from '../src/shared/http/auth/decorators/roles.decorator';
import { AuthenticationGuard } from '../src/shared/http/auth/guards/authentication.guard';
import { PermissionsGuard } from '../src/shared/http/auth/guards/permissions.guard';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import type { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import type { ActorContext } from '../src/shared/security/contexts/actor-context';
import { AccessError } from '../src/shared/security/errors/access-error';
import { AUTHENTICATOR } from '../src/shared/security/ports/authenticator.port';

const now = new Date('2026-11-01T12:00:00Z');
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
const otherGraduate: ActorContext = { ...graduate, id: randomUUID() };
const admin: ActorContext = { ...graduate, id: randomUUID(), role: 'administrador' };

// Fixture registered only in this test module: no production cancellation endpoint is added.
@Controller('__test__/registration-cancellation-authorization')
class CancellationAuthorizationTestController {
  constructor(@Inject(EVENTS_REPOSITORY) private readonly repository: EventsRepository) {}

  @Post(':id')
  @HttpCode(204)
  @Roles('titulado')
  async handle(@CurrentActor() actor: ActorContext, @Param('id') id: string): Promise<void> {
    await this.repository.assertCancellable(actor.id, id, now);
  }
}

function writeMethods() {
  return {
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };
}

function initialState() {
  return {
    registration: { id: registrationId, id_usuario: graduate.id, estado: 'CONFIRMADA' },
    event: { fecha_fin: new Date(now.getTime() + 1), cupo_maximo: 10 },
    pass: { id_inscripcion: registrationId, estado: 'VIGENTE' },
  };
}

describe('Registration cancellation authorization with existing guards', () => {
  let app: INestApplication;
  let state = initialState();
  let before: ReturnType<typeof initialState>;
  const prisma = {
    inscripcionEvento: {
      ...writeMethods(),
      findFirst: jest.fn(async ({ where }: { where: { id: string; id_usuario: string } }) =>
        state.registration.id === where.id && state.registration.id_usuario === where.id_usuario
          ? { estado: state.registration.estado, evento: { fecha_fin: state.event.fecha_fin } }
          : null,
      ),
    },
    evento: writeMethods(),
    paseQr: writeMethods(),
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
  };
  const authenticate = jest.fn(async (token: string) => {
    const actor =
      token === 'graduate'
        ? graduate
        : token === 'other-graduate'
          ? otherGraduate
          : token === 'admin'
            ? admin
            : null;
    if (!actor) {
      throw new AccessError('UNAUTHENTICATED');
    }
    return { actor, sessionId: randomUUID() };
  });
  const path = (id = registrationId) =>
    `/api/v1/__test__/registration-cancellation-authorization/${id}`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CancellationAuthorizationTestController],
      providers: [
        {
          provide: ConfigService,
          useValue: new ConfigService({ CORS_ORIGINS: ['http://localhost:3001'] }),
        },
        { provide: AUTHENTICATOR, useValue: { execute: authenticate } },
        {
          provide: EVENTS_REPOSITORY,
          useFactory: () => new PrismaEventsRepository(prisma as unknown as PrismaService),
        },
        { provide: APP_GUARD, useClass: AuthenticationGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureHttp(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    state = initialState();
    before = structuredClone(state);
  });

  afterEach(() => {
    expect(state).toEqual(before);
    for (const delegate of [prisma.inscripcionEvento, prisma.evento, prisma.paseQr]) {
      for (const method of [
        'create',
        'createMany',
        'update',
        'updateMany',
        'upsert',
        'delete',
        'deleteMany',
      ] as const) {
        expect(delegate[method]).not.toHaveBeenCalled();
      }
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  afterAll(async () => app?.close());

  it('allows the owner and uses the server identity despite client-supplied user IDs', async () => {
    await request(app.getHttpServer())
      .post(path())
      .set('Authorization', 'Bearer graduate')
      .set('x-user-id', otherGraduate.id)
      .send({ userId: otherGraduate.id })
      .expect(204);
    expect(prisma.inscripcionEvento.findFirst).toHaveBeenCalledWith({
      where: { id: registrationId, id_usuario: graduate.id },
      select: { estado: true, evento: { select: { fecha_fin: true } } },
    });
  });

  it('rejects unauthenticated requests before accessing persistence', async () => {
    const response = await request(app.getHttpServer()).post(path()).expect(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(authenticate).not.toHaveBeenCalled();
    expect(prisma.inscripcionEvento.findFirst).not.toHaveBeenCalled();
  });

  it('rejects an invalid session before accessing persistence', async () => {
    const response = await request(app.getHttpServer())
      .post(path())
      .set('Authorization', 'Bearer expired')
      .expect(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(prisma.inscripcionEvento.findFirst).not.toHaveBeenCalled();
  });

  it('requires the titulado role before accessing persistence', async () => {
    const response = await request(app.getHttpServer())
      .post(path())
      .set('Authorization', 'Bearer admin')
      .expect(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(prisma.inscripcionEvento.findFirst).not.toHaveBeenCalled();
  });

  it('returns the same controlled error for foreign and nonexistent registrations', async () => {
    const foreign = await request(app.getHttpServer())
      .post(path())
      .set('Authorization', 'Bearer other-graduate')
      .set('x-user-id', graduate.id)
      .send({ userId: graduate.id })
      .expect(404);
    expect(prisma.inscripcionEvento.findFirst).toHaveBeenLastCalledWith({
      where: { id: registrationId, id_usuario: otherGraduate.id },
      select: { estado: true, evento: { select: { fecha_fin: true } } },
    });
    const missing = await request(app.getHttpServer())
      .post(path(randomUUID()))
      .set('Authorization', 'Bearer graduate')
      .expect(404);
    expect(foreign.body).toEqual(missing.body);
    expect(missing.body.error.code).toBe('EVENT_REGISTRATION_NOT_FOUND');
  });

  it('rejects a cancelled registration with a business conflict', async () => {
    state.registration.estado = 'CANCELADA';
    before = structuredClone(state);
    const response = await request(app.getHttpServer())
      .post(path())
      .set('Authorization', 'Bearer graduate')
      .expect(409);
    expect(response.body.error.code).toBe('EVENT_REGISTRATION_NOT_CONFIRMED');
  });

  it.each([-1, 0])('rejects an event ending now + %i ms', async (offset) => {
    state.event.fecha_fin = new Date(now.getTime() + offset);
    before = structuredClone(state);
    const response = await request(app.getHttpServer())
      .post(path())
      .set('Authorization', 'Bearer graduate')
      .expect(409);
    expect(response.body.error.code).toBe('EVENT_REGISTRATION_NOT_CANCELLABLE');
  });
});
