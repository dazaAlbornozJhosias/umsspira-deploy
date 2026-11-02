/// <reference types="jest" />
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
import { BusinessRuleError } from '../src/shared/errors/business-rule-error';
import { AccessError } from '../src/shared/security/errors/access-error';
import { HttpError } from '../src/shared/http/errors/http-error';
import { GenerateEventPassService } from '../src/modules/events/application/generate-event-pass.service';

jest.setTimeout(30000);

const graduateId = randomUUID();
const recordId = randomUUID();
const eventId = randomUUID();
const coverId = randomUUID();
const graduate: ActorContext = {
  id: randomUUID(),
  email: 'titulado@example.com',
  name: 'María Pérez',
  role: 'titulado',
  credentialVersion: 1,
  permissions: ['perfil:self:read', 'perfil:self:write'],
  scopes: { graduateId, companyIds: [], careerIds: [] },
};
const admin: ActorContext = {
  ...graduate,
  id: randomUUID(),
  role: 'administrador',
  permissions: ['eventos:manage'],
  scopes: { graduateId: null, companyIds: [], careerIds: [] },
};
const education = {
  institucion: 'Universidad',
  titulo: 'Ingeniería',
  grado: 'Licenciatura',
  anioEgreso: 2025,
};
const eventInput = {
  title: 'Feria profesional',
  startDate: '2027-01-01T10:00:00Z',
  endDate: '2027-01-01T18:00:00Z',
  maxCapacity: 100,
};
const event = {
  id: eventId,
  ownerId: admin.id,
  title: eventInput.title,
  description: null,
  startDate: new Date(eventInput.startDate),
  endDate: new Date(eventInput.endDate),
  maxCapacity: 100,
  location: null,
  coverId: null,
  status: 'BORRADOR',
  creatorName: 'Administración',
  createdAt: new Date(),
};
const eventRegistration = {
  id: randomUUID(),
  eventId,
  userId: graduate.id,
  status: 'CONFIRMADA' as const,
  registeredAt: new Date(),
  currentCapacity: 1,
};
const profile = {
  graduate: { id: graduateId, name: 'María Pérez', career: 'Sistemas', cohort: null },
  education: [],
  experience: [],
  certifications: [],
  description: { text: '', updatedAt: null },
};

describe('Perfil y eventos con contratos y guards compartidos', () => {
  let app: INestApplication;
  const profiles = {
    summary: jest.fn(),
    createEducation: jest.fn(),
    createExperience: jest.fn(),
    createCertification: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    saveBackup: jest.fn(),
    readBackup: jest.fn(),
    findBackupOwner: jest.fn(),
    readBackupFile: jest.fn(),
  };
  const events = {
    catalog: jest.fn(),
    published: jest.fn(),
    owned: jest.fn(),
    findOwned: jest.fn(),
    create: jest.fn(),
    updateDraft: jest.fn(),
    publishDraft: jest.fn(),
    register: jest.fn(),
    assertCancellable: jest.fn(),
    cancelRegistration: jest.fn(),
    cancelPublished: jest.fn(),
    saveCover: jest.fn(),
    removeCover: jest.fn(),
    readCover: jest.fn(),
  };

  const generatePassMock = {
    execute: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(PROFILE_REPOSITORY)
      .useValue(profiles)
      .overrideProvider(EVENTS_REPOSITORY)
      .useValue(events)
      .overrideProvider(GenerateEventPassService)
      .useValue(generatePassMock)
      .overrideProvider(AUTHENTICATOR)
      .useValue({
        execute: async (token: string) => {
          if (token === 'expired') {
            throw new AccessError('UNAUTHENTICATED');
          }
          if (token === 'database-down') {
            throw new HttpError(503, 'DATABASE_UNAVAILABLE', 'La base de datos no está disponible');
          }
          return {
            actor:
              token === 'admin'
                ? admin
                : token === 'no-profile'
                  ? { ...graduate, scopes: { ...graduate.scopes, graduateId: null } }
                  : graduate,
            sessionId: randomUUID(),
          };
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureHttp(app);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    profiles.summary.mockResolvedValue(profile);
    profiles.createEducation.mockResolvedValue({
      id: recordId,
      graduateId,
      kind: 'education',
      institution: education.institucion,
      title: education.titulo,
      degree: education.grado,
      graduationYear: education.anioEgreso,
      createdAt: new Date(),
    });
    events.create.mockResolvedValue(event);
    events.catalog.mockResolvedValue([]);
    events.findOwned.mockResolvedValue(event);
    events.register.mockResolvedValue(eventRegistration);
    generatePassMock.execute.mockResolvedValue(undefined);
  });

  afterAll(async () => app?.close());

  it('exige sesión y permiso para consultar el perfil', async () => {
    await request(app.getHttpServer()).get('/api/v1/perfil').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/perfil')
      .set('Authorization', 'Bearer admin')
      .expect(403);
    expect(profiles.summary).not.toHaveBeenCalled();
  });

  it('usa el perfil ligado a la sesión, sin aceptar identidad por cabeceras', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/perfil')
      .set('Authorization', 'Bearer graduate')
      .set('x-user-id', randomUUID())
      .expect(200);
    expect(profiles.summary).toHaveBeenCalledWith({ graduateId, userId: graduate.id });
    expect(response.body.data.formacionAcademica).toEqual({ total: 0, registros: [] });
  });

  it('rechaza cuentas sin perfil de titulado asociado', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/perfil')
      .set('Authorization', 'Bearer no-profile')
      .expect(403);
    expect(profiles.summary).not.toHaveBeenCalled();
  });

  it('crea formación con datos validados y dueño derivado de la sesión', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/perfil/formacion-academica')
      .set('Authorization', 'Bearer graduate')
      .send(education)
      .expect(201);
    expect(response.body.data.idTitulado).toBe(graduateId);
    expect(profiles.createEducation).toHaveBeenCalledWith(
      { graduateId, userId: graduate.id },
      education,
    );
  });

  it('crea certificación con grado Profesional por defecto y dueño derivado de la sesión', async () => {
    profiles.createCertification.mockResolvedValue({
      id: recordId,
      graduateId,
      kind: 'certification',
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      degree: 'Profesional',
      issuedYear: 2022,
      backup: null,
      createdAt: new Date(),
    });
    const response = await request(app.getHttpServer())
      .post('/api/v1/perfil/certificaciones')
      .set('Authorization', 'Bearer graduate')
      .send({
        nombre: 'AWS Solutions Architect',
        entidadEmisora: 'Amazon Web Services',
        anioEmision: 2022,
      })
      .expect(201);
    expect(response.body.data.grado).toBe('Profesional');
    expect(profiles.createCertification).toHaveBeenCalledWith(
      { graduateId, userId: graduate.id },
      {
        nombre: 'AWS Solutions Architect',
        entidadEmisora: 'Amazon Web Services',
        anioEmision: 2022,
        grado: 'Profesional',
      },
    );
  });

  it('rechaza campos de propiedad y años futuros', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/perfil/formacion-academica')
      .set('Authorization', 'Bearer graduate')
      .send({ ...education, idTitulado: randomUUID() })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/perfil/certificaciones')
      .set('Authorization', 'Bearer graduate')
      .send({ nombre: 'Certificado', entidadEmisora: 'Entidad', grado: 'Curso', anioEmision: 9999 })
      .expect(400);
    expect(profiles.createEducation).not.toHaveBeenCalled();
    expect(profiles.createCertification).not.toHaveBeenCalled();
  });

  it('valida fechas laborales y conserva null al indicar trabajo actual', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/perfil/experiencia-laboral')
      .set('Authorization', 'Bearer graduate')
      .send({
        empresa: 'Empresa',
        cargo: 'Desarrollo',
        fechaInicio: '2025-02-01',
        fechaFin: '2025-01-01',
      })
      .expect(400);
    profiles.update.mockResolvedValue({
      id: recordId,
      graduateId,
      kind: 'experience',
      company: 'Empresa',
      position: 'Desarrollo',
      startDate: new Date('2025-02-01'),
      endDate: null,
      createdAt: new Date(),
    });
    const response = await request(app.getHttpServer())
      .put('/api/v1/perfil/experiencia-laboral/' + recordId)
      .set('Authorization', 'Bearer graduate')
      .send({
        empresa: 'Empresa',
        cargo: 'Desarrollo',
        fechaInicio: '2025-02-01',
        fechaFin: null,
      })
      .expect(200);
    expect(response.body.data.fechaFin).toBeNull();
  });

  it('valida UUID antes de consultar un registro', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/perfil/certificaciones/no-uuid')
      .set('Authorization', 'Bearer graduate')
      .expect(400);
    expect(profiles.find).not.toHaveBeenCalled();
  });

  it('descarga un JSON válido con nombre de archivo normalizado', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/perfil/exportar-json')
      .set('Authorization', 'Bearer graduate')
      .expect(200);
    expect(response.headers['content-disposition']).toContain('perfil_maria_perez_');
    expect(response.body.titulado.id).toBe(graduateId);
    expect(response.body.fechaExportacion).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
    expect(response.body).toHaveProperty(['Formación académica', 'total']);
    expect(response.body).not.toHaveProperty('formacionAcademica');
    expect(response.body).not.toHaveProperty('password_hash');
  });

  it('protege respaldos y rechaza un PNG como respaldo JPG de certificación', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/perfil/certificaciones/' + recordId + '/respaldo')
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/perfil/certificaciones/' + recordId + '/respaldo')
      .set('Authorization', 'Bearer graduate')
      .attach(
        'archivo',
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        'certificado.png',
      )
      .expect(400);
    expect(profiles.saveBackup).not.toHaveBeenCalled();
  });

  it('entrega un enlace firmado y temporal del respaldo JPG', async () => {
    profiles.findBackupOwner.mockResolvedValue({
      graduateId,
      userId: graduate.id,
      hasBackup: true,
    });
    profiles.readBackupFile.mockResolvedValue({
      id: randomUUID(),
      name: 'aws.jpg',
      mime: 'image/jpeg',
      bytes: new Uint8Array([0xff, 0xd8, 0xff]),
      size: 3,
    });

    await request(app.getHttpServer())
      .get('/api/v1/perfil/certificaciones/' + recordId + '/respaldo/enlace')
      .expect(401);
    const response = await request(app.getHttpServer())
      .get('/api/v1/perfil/certificaciones/' + recordId + '/respaldo/enlace')
      .set('Authorization', 'Bearer graduate')
      .expect(200);
    const { url, expiraEn } = response.body.data;
    const seconds = (new Date(expiraEn).getTime() - Date.now()) / 1000;
    expect(seconds).toBeGreaterThan(290);
    expect(seconds).toBeLessThanOrEqual(300);

    const file = await request(app.getHttpServer()).get(url).expect(200);
    expect(file.headers['content-type']).toContain('image/jpeg');
    expect(file.headers['content-disposition']).toMatch(/^inline/);
    expect(profiles.readBackupFile).toHaveBeenCalledWith(recordId);
    const download = await request(app.getHttpServer())
      .get(url + '&descargar=1')
      .expect(200);
    expect(download.headers['content-disposition']).toMatch(/^attachment/);

    await request(app.getHttpServer())
      .get(url.replace(/firma=[^&]+/, 'firma=alterada'))
      .expect(403);
  });

  it('responde 403 y no entrega enlace si el respaldo es de otro titulado', async () => {
    profiles.findBackupOwner.mockResolvedValue({
      graduateId: randomUUID(),
      userId: randomUUID(),
      hasBackup: true,
    });
    const response = await request(app.getHttpServer())
      .get('/api/v1/perfil/certificaciones/' + recordId + '/respaldo/enlace')
      .set('Authorization', 'Bearer graduate')
      .expect(403);
    expect(response.body.error.message).toBe('No tienes permiso para ver este respaldo');
    expect(response.body).not.toHaveProperty('data');
    expect(profiles.readBackupFile).not.toHaveBeenCalled();
  });

  it('responde 404 al pedir el enlace de una certificación sin respaldo', async () => {
    profiles.findBackupOwner.mockResolvedValue({
      graduateId,
      userId: graduate.id,
      hasBackup: false,
    });
    const response = await request(app.getHttpServer())
      .get('/api/v1/perfil/certificaciones/' + recordId + '/respaldo/enlace')
      .set('Authorization', 'Bearer graduate')
      .expect(404);
    expect(response.body.error.message).toBe('No se encontró un respaldo de tu certificación');
  });

  it('deja público el catálogo y protege la gestión de eventos', async () => {
    await request(app.getHttpServer()).get('/api/v1/events/catalog').expect(200, { data: [] });
    await request(app.getHttpServer()).get('/api/v1/events/owned').expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', 'Bearer graduate')
      .send(eventInput)
      .expect(403);
    expect(events.create).not.toHaveBeenCalled();
  });

  it('crea borradores por defecto con el propietario verificado', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', 'Bearer admin')
      .send(eventInput)
      .expect(201);
    expect(events.create).toHaveBeenCalledWith(admin.id, { ...eventInput, status: 'BORRADOR' });
    expect(response.body.data.status).toBe('BORRADOR');
  });

  it('inscribe al titulado autenticado sin aceptar una identidad del cliente', async () => {
    await request(app.getHttpServer()).post('/api/v1/events/' + eventId + '/registrations').expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/events/' + eventId + '/registrations')
      .set('Authorization', 'Bearer admin')
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/events/no-uuid/registrations')
      .set('Authorization', 'Bearer graduate')
      .expect(400);

    const response = await request(app.getHttpServer())
      .post('/api/v1/events/' + eventId + '/registrations')
      .set('Authorization', 'Bearer graduate')
      .set('x-user-id', randomUUID())
      .expect(201);

    expect(events.register).toHaveBeenCalledWith(graduate.id, eventId);
    expect(response.body.data).toEqual({
      id: eventRegistration.id,
      eventId,
      status: 'CONFIRMADA',
      registeredAt: eventRegistration.registeredAt.toISOString(),
      currentCapacity: 1,
    });
  });

  it.each([
    ['evento no disponible', 'EVENT_NOT_AVAILABLE'],
    ['sin cupos', 'EVENT_CAPACITY_REACHED'],
    ['inscripciÃ³n duplicada', 'EVENT_REGISTRATION_ALREADY_CONFIRMED'],
  ])('expone el error de negocio al inscribirse: %s', async (_scenario, code) => {
    events.register.mockRejectedValue(new BusinessRuleError('conflict', code, 'No disponible'));

    const response = await request(app.getHttpServer())
      .post('/api/v1/events/' + eventId + '/registrations')
      .set('Authorization', 'Bearer graduate')
      .expect(409);

    expect(response.body.error.code).toBe(code);
  });

  it.each([
    { maxCapacity: 0 },
    { maxCapacity: 10001 },
    { title: '12345' },
    { endDate: eventInput.startDate },
    { startDate: '2101-01-01T10:00:00Z', endDate: '2101-01-02T10:00:00Z' },
    { imageUrl: 'https://otro.example/imagen.jpg' },
    { ownerId: randomUUID() },
  ])('rechaza eventos inválidos: %j', async (change) => {
    await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', 'Bearer admin')
      .send({ ...eventInput, ...change })
      .expect(400);
    expect(events.create).not.toHaveBeenCalled();
  });

  it('traduce la referencia de portada a su UUID sin aceptar una URL arbitraria', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', 'Bearer admin')
      .send({ ...eventInput, imageUrl: '/api/v1/events/covers/' + coverId })
      .expect(201);
    expect(events.create).toHaveBeenCalledWith(admin.id, expect.objectContaining({ coverId }));
  });

  it('no permite abrir como borrador un evento publicado', async () => {
    events.findOwned.mockResolvedValue({ ...event, status: 'PUBLICADO' });
    await request(app.getHttpServer())
      .get('/api/v1/events/drafts/' + eventId)
      .set('Authorization', 'Bearer admin')
      .expect(409);
  });

  it('propaga al repositorio la identidad al editar o publicar', async () => {
    events.updateDraft.mockResolvedValue(event);
    events.publishDraft.mockResolvedValue({ ...event, status: 'PUBLICADO' });
    await request(app.getHttpServer())
      .patch('/api/v1/events/drafts/' + eventId)
      .set('Authorization', 'Bearer admin')
      .send(eventInput)
      .expect(200);
    await request(app.getHttpServer())
      .patch('/api/v1/events/drafts/' + eventId + '/publish')
      .set('Authorization', 'Bearer admin')
      .expect(200);
    expect(events.updateDraft).toHaveBeenCalledWith(admin.id, eventId, eventInput);
    expect(events.publishDraft).toHaveBeenCalledWith(admin.id, eventId);
  });

  it('permite al administrador cancelar un evento publicado', async () => {
    events.cancelPublished.mockResolvedValue({
      event: { ...event, status: 'CANCELADO' },
      registrationsCount: 1,
      invalidatedPassesCount: 1,
    });

    const response = await request(app.getHttpServer())
      .patch('/api/v1/events/' + eventId + '/cancel')
      .set('Authorization', 'Bearer admin')
      .expect(200);

    expect(response.body.data.event.status).toBe('CANCELADO');
    expect(response.body.data.registrationsCount).toBe(1);
    expect(response.body.data.invalidatedPassesCount).toBe(1);
    expect(events.cancelPublished).toHaveBeenCalledWith(admin.id, eventId);
  });

  it('rechaza la cancelación si el usuario no tiene permiso', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/events/' + eventId + '/cancel')
      .set('Authorization', 'Bearer graduate')
      .expect(403);
  });

  it('no hace pública la identidad de cabeceras al leer una portada', async () => {
    events.readCover.mockRejectedValue(
      new BusinessRuleError('missing', 'COVER_NOT_FOUND', 'Portada no disponible'),
    );
    await request(app.getHttpServer())
      .get('/api/v1/events/covers/' + coverId)
      .set('x-user-id', admin.id)
      .expect(404);
    expect(events.readCover).toHaveBeenCalledWith(coverId, undefined);
    await request(app.getHttpServer())
      .get('/api/v1/events/covers/' + coverId)
      .set('Authorization', 'Bearer admin')
      .expect(404);
    expect(events.readCover).toHaveBeenLastCalledWith(coverId, admin);
  });

  it('rechaza imágenes con tipo y contenido distintos antes de guardarlas', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/events/covers')
      .set('Authorization', 'Bearer admin')
      .attach('file', Buffer.from('archivo falso'), {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);
    expect(events.saveCover).not.toHaveBeenCalled();
  });

  it('permite la lectura pública de portada con una cookie vencida sin conservar identidad', async () => {
    events.readCover.mockResolvedValue({
      id: coverId,
      name: 'portada.jpg',
      mime: 'image/jpeg',
      bytes: Buffer.from([255, 216, 255]),
      size: 3,
    });
    await request(app.getHttpServer())
      .get('/api/v1/events/covers/' + coverId)
      .set('Cookie', 'umsspira_token=expired')
      .expect('Cross-Origin-Resource-Policy', 'cross-origin')
      .expect(200);
    expect(events.readCover).toHaveBeenCalledWith(coverId, undefined);
  });

  it('no disimula una falla de persistencia como lectura anónima', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/events/covers/' + coverId)
      .set('Authorization', 'Bearer database-down')
      .expect(503);
    expect(events.readCover).not.toHaveBeenCalled();
  });
});