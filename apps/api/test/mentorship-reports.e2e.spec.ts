import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { AUTHENTICATOR } from '../src/shared/security/ports/authenticator.port';
import type { ActorContext } from '../src/shared/security/contexts/actor-context';
import { MENTOR_REPOSITORY } from '../src/modules/mentorship/application/ports/mentor-repository.port';
import { MENTOR_CATALOG_REPOSITORY } from '../src/modules/mentorship/application/ports/mentor-catalog-repository.port';
import { MENTOR_AVAILABILITY_REPOSITORY } from '../src/modules/mentorship/application/ports/mentor-availability-repository.port';
import { REPORT_REPOSITORY } from '../src/modules/reports/application/ports/report-repository.port';
import { RATE_LIMITER } from '../src/modules/auth/application/ports/rate-limiter.port';
import type { Mentor } from '../src/modules/mentorship/domain/entities/mentor';
import type { GraduateReportRecord } from '../src/modules/reports/domain/entities/graduate-report';

const careerId = randomUUID();
const mentorId = randomUUID();
const graduate: ActorContext = {
  id: randomUUID(),
  email: 'titulado@example.com',
  name: 'María Pérez',
  role: 'titulado',
  credentialVersion: 1,
  permissions: ['mentores:self:write'],
  scopes: { graduateId: randomUUID(), companyIds: [], careerIds: [] },
};
const admin: ActorContext = {
  ...graduate,
  id: randomUUID(),
  role: 'administrador',
  permissions: ['mentores:manage', 'reportes:read'],
  scopes: { graduateId: null, companyIds: [], careerIds: [careerId] },
};
const mentor: Mentor = {
  id: mentorId,
  graduateId: graduate.scopes.graduateId!,
  graduateName: graduate.name ?? '',
  careerId,
  active: true,
  description: 'Mentora',
  experience: 'Desarrollo de software',
  relevantInformation: 'Dato reservado',
  photoUrl: null,
  experienceYears: 2,
  createdAt: new Date('2026-10-18'),
  updatedAt: new Date('2026-10-18'),
};
const record: GraduateReportRecord = {
  id: randomUUID(),
  careerId,
  careerName: 'Ingeniería de Sistemas',
  firstName: 'María',
  lastName: 'Pérez',
  email: 'maria@example.com',
  phone: '70000000',
  identityNumber: '1234567',
  identityComplement: '',
  issuedIn: 'CB',
  sisCode: '202012345',
  graduationYear: null,
  admissionDate: new Date('2020-02-01'),
  graduationDate: new Date('2025-05-01'),
  submittedAt: new Date('2026-10-18'),
  reviewedAt: null,
  justification: null,
  wantsMentorship: true,
  status: 'APROBADA',
};

describe('Mentorías y reportería: contratos HTTP y autorización', () => {
  let app: INestApplication;
  const mentors = {
    directory: jest.fn(),
    detail: jest.fn(),
    eligible: jest.fn(),
    own: jest.fn(),
    participate: jest.fn(),
    updateInformation: jest.fn(),
    clearInformation: jest.fn(),
    deactivate: jest.fn(),
  };
  const catalog = {
    areas: jest.fn(),
    setAreas: jest.fn(),
    interestCatalog: jest.fn(),
    interests: jest.fn(),
    addInterests: jest.fn(),
    removeInterest: jest.fn(),
  };
  const availability = { own: jest.fn(), update: jest.fn(), canReceiveRequests: jest.fn() };
  const reports = { metrics: jest.fn(), list: jest.fn(), exportData: jest.fn() };
  const limiter = { consume: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(MENTOR_REPOSITORY)
      .useValue(mentors)
      .overrideProvider(MENTOR_CATALOG_REPOSITORY)
      .useValue(catalog)
      .overrideProvider(MENTOR_AVAILABILITY_REPOSITORY)
      .useValue(availability)
      .overrideProvider(REPORT_REPOSITORY)
      .useValue(reports)
      .overrideProvider(RATE_LIMITER)
      .useValue(limiter)
      .overrideProvider(AUTHENTICATOR)
      .useValue({
        execute: async (token: string) => ({
          actor:
            token === 'admin'
              ? admin
              : token === 'unassigned'
                ? { ...admin, scopes: { ...admin.scopes, careerIds: [] } }
                : token === 'graduate-with-report-permission'
                  ? { ...graduate, permissions: ['mentores:self:write', 'reportes:read'] }
                  : graduate,
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
    mentors.own.mockResolvedValue(mentor);
    mentors.participate.mockResolvedValue(mentor);
    mentors.deactivate.mockResolvedValue({ ...mentor, active: false });
    mentors.directory.mockResolvedValue({
      entries: [
        { mentor, areas: [], interests: [], availability: 'DISPONIBLE', cargo: null, empresa: null },
      ],
      total: 1,
      catalog: [],
    });
    mentors.detail.mockResolvedValue({
      mentor,
      areas: [{ id: careerId, name: 'Backend' }],
      interests: [],
      availability: 'DISPONIBLE',
      canRequest: true,
      schedules: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, start: '00:00', end: '23:59' })),
      bookings: [],
      position: 'Backend Developer',
      company: null,
    });
    reports.metrics.mockResolvedValue({
      totalApplications: 2,
      approvedApplications: 1,
      observedApplications: 0,
      activeMentors: 1,
    });
    reports.list.mockResolvedValue({ records: [record], total: 1, page: 1, limit: 10 });
    reports.exportData.mockResolvedValue({ records: [record], careerNames: [record.careerName] });
    limiter.consume.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });
  afterAll(async () => app?.close());

  it('protege el directorio y publica únicamente la información pública paginada', async () => {
    await request(app.getHttpServer()).get('/api/v1/mentorship/profiles').expect(401);

    const response = await request(app.getHttpServer())
      .get('/api/v1/mentorship/profiles')
      .set('Authorization', 'Bearer graduate')
      .query({ offset: 0, limit: 6 })
      .expect(200);
    expect(response.body.data[0].nombre).toBe(graduate.name);
    expect(response.body.total).toBe(1);
    expect(response.body.catalog).toEqual([]);
    expect(JSON.stringify(response.body)).not.toContain('Dato reservado');
    expect(JSON.stringify(response.body)).not.toContain(graduate.id);
    expect(mentors.directory).toHaveBeenCalledWith({ offset: 0, limit: 6 });
  });

  it('valida paginación y rechaza métodos de escritura para el directorio', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/mentorship/profiles')
      .set('Authorization', 'Bearer graduate')
      .query({ offset: -1 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/mentorship/profiles')
      .set('Authorization', 'Bearer graduate')
      .expect(405);
  });
  it('exige sesión para consultar el perfil detallado de un mentor', async () => {
    await request(app.getHttpServer()).get(`/api/v1/mentorship/profiles/${mentorId}`).expect(401);
    expect(mentors.detail).not.toHaveBeenCalled();
  });
  it('entrega el perfil detallado sin datos privados', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/mentorship/profiles/${mentorId.toUpperCase()}`)
      .set('Authorization', 'Bearer graduate')
      .expect(200);
    const day = expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/);
    expect(mentors.detail).toHaveBeenCalledWith(mentorId, day, day);
    const { slots, weekLabel, ...profile } = response.body.data;
    expect(profile).toEqual({
      id: mentorId,
      fullName: graduate.name,
      photoUrl: null,
      jobTitle: 'Backend Developer',
      company: null,
      about: 'Mentora',
      experience: 'Desarrollo de software',
      relevantInfo: 'Dato reservado',
      technicalAreas: ['Backend'],
      interests: [],
      availability: 'AVAILABLE',
    });
    expect(weekLabel).toMatch(/^Del \d{1,2}( [a-z]{3})? al \d{1,2} [a-z]{3} · sesiones de 1 hora$/);
    expect(slots.length).toBeGreaterThanOrEqual(6);
    for (const slot of slots) {
      expect(slot.date).toEqual(day);
      expect(slot.dayLabel).toMatch(/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo) \d{1,2} [a-z]{3}$/);
      expect(slot.times.every((time: string) => /^\d{2}:\d{2}$/.test(time))).toBe(true);
    }
    const body = JSON.stringify(response.body);
    expect(body).not.toContain(graduate.id);
    expect(body).not.toContain(mentor.graduateId);
    expect(body).not.toContain(graduate.email);
  });
  it('rechaza identificadores inválidos y responde 404 si el perfil no está disponible', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/mentorship/profiles/no-es-uuid')
      .set('Authorization', 'Bearer graduate')
      .expect(400);
    expect(mentors.detail).not.toHaveBeenCalled();
    mentors.detail.mockResolvedValue(null);
    const response = await request(app.getHttpServer())
      .get(`/api/v1/mentorship/profiles/${randomUUID()}`)
      .set('Authorization', 'Bearer graduate')
      .expect(404);
    expect(response.body.error.code).toBe('MENTOR_NOT_FOUND');
  });
  it('no expone acciones de escritura sobre el perfil detallado', async () => {
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const response = await request(app.getHttpServer())
        [method](`/api/v1/mentorship/profiles/${mentorId}`)
        .set('Authorization', 'Bearer graduate');
      expect(response.status).toBe(404);
    }
    expect(mentors.detail).not.toHaveBeenCalled();
    expect(mentors.updateInformation).not.toHaveBeenCalled();
  });
  it('exige sesión y permiso para gestionar la participación', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/mentorship/my-profile/participation')
      .send({ esta_activo: true })
      .expect(401);
    await request(app.getHttpServer())
      .patch('/api/v1/mentorship/my-profile/participation')
      .set('Authorization', 'Bearer admin')
      .send({ esta_activo: true })
      .expect(403);
    expect(mentors.participate).not.toHaveBeenCalled();
  });
  it('deriva la identidad de la sesión y valida el cuerpo', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/mentorship/my-profile/participation')
      .set('Authorization', 'Bearer graduate')
      .set('x-user-id', admin.id)
      .send({ esta_activo: true, experiencia: 'Experiencia', anios_exp: 3 })
      .expect(200);
    expect(mentors.participate).toHaveBeenCalledWith(graduate.id, {
      esta_activo: true,
      experiencia: 'Experiencia',
      anios_exp: 3,
    });
    await request(app.getHttpServer())
      .patch('/api/v1/mentorship/my-profile/participation')
      .set('Authorization', 'Bearer graduate')
      .send({ esta_activo: 'true' })
      .expect(400);
  });
  it('devuelve 404 si todavía no existe el perfil', async () => {
    mentors.own.mockResolvedValue(null);
    const response = await request(app.getHttpServer())
      .get('/api/v1/mentorship/my-profile')
      .set('Authorization', 'Bearer graduate')
      .expect(404);
    expect(response.body.error.code).toBe('MENTOR_NOT_FOUND');
  });
  it('rechaza UUID inválidos e intereses repetidos antes de persistir', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/mentorship/my-profile/areas')
      .set('Authorization', 'Bearer graduate')
      .send({ areaIds: ['id-inválido'] })
      .expect(400);
    const id = randomUUID();
    await request(app.getHttpServer())
      .post('/api/v1/mentorship/interests')
      .set('Authorization', 'Bearer graduate')
      .send({ ids: [id, id] })
      .expect(409);
    expect(catalog.setAreas).not.toHaveBeenCalled();
    expect(catalog.addInterests).not.toHaveBeenCalled();
  });
  it('limita la desactivación administrativa a las carreras de la sesión', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/mentorship/profiles/' + mentorId + '/deactivate')
      .set('Authorization', 'Bearer admin')
      .expect(200);
    expect(mentors.deactivate).toHaveBeenCalledWith(mentorId, [careerId]);
  });
  it('valida el estado de disponibilidad y permite pausarlo', async () => {
    availability.update.mockResolvedValue({ status: 'EN_PAUSA', updatedAt: new Date() });
    await request(app.getHttpServer())
      .patch('/api/v1/mentorship/availability')
      .set('Authorization', 'Bearer graduate')
      .send({ availabilityStatus: 'EN_PAUSA' })
      .expect(200);
    expect(availability.update).toHaveBeenCalledWith(graduate.id, 'EN_PAUSA');
    await request(app.getHttpServer())
      .patch('/api/v1/mentorship/availability')
      .set('Authorization', 'Bearer graduate')
      .send({ availabilityStatus: 'OTHER' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/v1/mentorship/availability')
      .set('Authorization', 'Bearer graduate')
      .send({ availabilityStatus: 'AVAILABLE' })
      .expect(400);
  });
  it('protege los reportes por permiso y por alcance de carrera', async () => {
    await request(app.getHttpServer()).get('/api/v1/reports/metrics').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/reports/metrics')
      .set('Authorization', 'Bearer graduate')
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/reports/metrics')
      .set('Authorization', 'Bearer unassigned')
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/reports/metrics')
      .query({ careerId: randomUUID() })
      .set('Authorization', 'Bearer admin')
      .expect(403);
    expect(reports.metrics).not.toHaveBeenCalled();
  });
  it('HU-004: aun con permiso reportes:read el titulado recibe 403 por su rol', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/reports/metrics')
      .set('Authorization', 'Bearer graduate-with-report-permission')
      .expect(403);
    expect(reports.metrics).not.toHaveBeenCalled();
  });

  it('entrega indicadores reales y limita las consultas a las carreras asignadas', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/metrics')
      .set('Authorization', 'Bearer admin')
      .expect(200);
    expect(response.body.data).toEqual({
      totalGraduates: 2,
      verifiedGraduates: 1,
      observedGraduates: 0,
      activeMentors: 1,
    });
    expect(reports.metrics).toHaveBeenCalledWith([careerId]);
  });
  it('pagina, filtra por estado y no inventa datos faltantes', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/graduates?status=APROBADA')
      .set('Authorization', 'Bearer admin')
      .expect(200);
    expect(response.body.data.items[0].anioEgreso).toBeNull();
    expect(response.body.data.items[0].fechaRevision).toBeNull();
    expect(reports.list).toHaveBeenCalledWith([careerId], {
      page: 1,
      limit: 10,
      status: 'APROBADA',
    });
    await request(app.getHttpServer())
      .get('/api/v1/reports/graduates?limit=1001')
      .set('Authorization', 'Bearer admin')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/reports/metrics?status=APROBADA')
      .set('Authorization', 'Bearer admin')
      .expect(400);
  });
  it('produce CSV con el mismo filtro y nombre de archivo descargable', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/graduates/csv?status=APROBADA')
      .set('Authorization', 'Bearer admin')
      .expect(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('.csv');
    expect(response.text).toContain('María');
    expect(reports.exportData).toHaveBeenCalledWith([careerId], { status: 'APROBADA' });
  });
  it('no exporta datos ficticios si no hay resultados', async () => {
    reports.exportData.mockResolvedValue({ records: [], careerNames: ['Sistemas'] });
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/graduates/pdf?status=RECHAZADA')
      .set('Authorization', 'Bearer admin')
      .expect(404);
    expect(response.body.error.code).toBe('REPORT_EMPTY');
  });
  it('aplica el límite de descargas antes de leer la base de datos', async () => {
    limiter.consume.mockResolvedValue({ allowed: false, retryAfterSeconds: 30 });
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/graduates/pdf')
      .set('Authorization', 'Bearer admin')
      .expect(429);
    expect(response.headers['retry-after']).toBe('30');
    expect(reports.exportData).not.toHaveBeenCalled();
  });
});
