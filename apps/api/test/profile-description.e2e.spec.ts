import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { AUTHENTICATOR } from '../src/shared/security/ports/authenticator.port';
import type { ActorContext } from '../src/shared/security/contexts/actor-context';
import { PROFILE_REPOSITORY } from '../src/modules/profile/application/ports/profile-repository.port';
import { EVENTS_REPOSITORY } from '../src/modules/events/application/ports/events-repository.port';

const graduateId = randomUUID();
const graduate: ActorContext = {
  id: randomUUID(),
  email: 'titulado@example.com',
  name: 'María Pérez',
  role: 'titulado',
  credentialVersion: 1,
  permissions: ['perfil:self:read', 'perfil:self:write'],
  scopes: { graduateId, companyIds: [], careerIds: [] },
};
const readOnly: ActorContext = { ...graduate, permissions: ['perfil:self:read'] };
const updatedAt = new Date('2026-10-24T12:00:00Z');

describe('Descripción profesional del titulado (T6.4)', () => {
  let app: INestApplication;
  const profiles = {
    summary: jest.fn(),
    findDescription: jest.fn(),
    saveDescription: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(PROFILE_REPOSITORY)
      .useValue(profiles)
      .overrideProvider(EVENTS_REPOSITORY)
      .useValue({})
      .overrideProvider(AUTHENTICATOR)
      .useValue({
        execute: async (token: string) => ({
          actor: token === 'read-only' ? readOnly : graduate,
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
    profiles.findDescription.mockResolvedValue({ text: '', updatedAt: null });
    profiles.saveDescription.mockImplementation(async (_scope, text: string) => ({
      text,
      updatedAt,
    }));
  });
  afterAll(async () => app?.close());

  it('exige sesión para leer o guardar la descripción', async () => {
    await request(app.getHttpServer()).get('/api/v1/perfil/descripcion-profesional').expect(401);
    await request(app.getHttpServer())
      .put('/api/v1/perfil/descripcion-profesional')
      .send({ descripcionProfesional: 'Hola' })
      .expect(401);
    expect(profiles.saveDescription).not.toHaveBeenCalled();
  });

  it('devuelve vacía la descripción de un titulado que aún no la registró', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/perfil/descripcion-profesional')
      .set('Authorization', 'Bearer graduate')
      .expect(200);
    expect(response.body).toEqual({
      data: { descripcionProfesional: '', fechaActualizacion: null },
    });
    expect(profiles.findDescription).toHaveBeenCalledWith({ graduateId, userId: graduate.id });
  });

  it('guarda el texto recortado en el perfil de la sesión y devuelve la fecha', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/v1/perfil/descripcion-profesional')
      .set('Authorization', 'Bearer graduate')
      .set('x-user-id', randomUUID())
      .send({ descripcionProfesional: '  Desarrolladora backend  ' })
      .expect(200);
    expect(response.body.data).toEqual({
      descripcionProfesional: 'Desarrolladora backend',
      fechaActualizacion: updatedAt.toISOString(),
    });
    expect(profiles.saveDescription).toHaveBeenCalledWith(
      { graduateId, userId: graduate.id },
      'Desarrolladora backend',
    );
  });

  it('rechaza con 400 más de 5000 caracteres o un dueño en el cuerpo', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/perfil/descripcion-profesional')
      .set('Authorization', 'Bearer graduate')
      .send({ descripcionProfesional: 'a'.repeat(5001) })
      .expect(400);
    await request(app.getHttpServer())
      .put('/api/v1/perfil/descripcion-profesional')
      .set('Authorization', 'Bearer graduate')
      .send({ descripcionProfesional: 'Hola', idTitulado: randomUUID() })
      .expect(400);
    expect(profiles.saveDescription).not.toHaveBeenCalled();
  });

  it('sin permiso de escritura no guarda', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/perfil/descripcion-profesional')
      .set('Authorization', 'Bearer read-only')
      .send({ descripcionProfesional: 'Hola' })
      .expect(403);
    expect(profiles.saveDescription).not.toHaveBeenCalled();
  });
});
