import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { z } from 'zod';
import { AppModule } from '../src/app.module';
import { DEMO_ACCOUNTS, DEMO_COMPANY_ID } from '../scripts/seed/demo-accounts';
import { Argon2PasswordHasher } from '../src/modules/auth/infrastructure/security/argon2-password.hasher';
import { CREDENTIAL_REPOSITORY } from '../src/modules/auth/application/ports/credential-repository.port';
import { SESSION_REPOSITORY } from '../src/modules/auth/application/ports/session-repository.port';
import { RATE_LIMITER } from '../src/modules/auth/application/ports/rate-limiter.port';
import { USER_READER } from '../src/modules/user/application/ports/user-reader.port';
import { COMPANY_PROFILE_REPOSITORY } from '../src/modules/companies/application/ports/company-profile-repository.port';
import { JOB_POSTING_REPOSITORY } from '../src/modules/job-postings/application/ports/job-posting-repository.port';
import {
  COMPANY_MEMBER_INVITATION_REPOSITORY,
  type MemberInvitationResult,
  type NewCompanyMemberInvitation,
} from '../src/modules/companies/application/ports/company-member-invitation-repository.port';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { RedisService } from '../src/shared/infrastructure/redis/redis.service';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { InMemoryAuthStore } from './adapters/in-memory-auth.store';
import { InMemoryCompanyProfileRepository } from './adapters/in-memory-company-profile.repository';
import { InMemoryJobPostingRepository } from './adapters/in-memory-job-posting.repository';

const companyRoot = '/api/v1/companies/' + DEMO_COMPANY_ID;
const foreignCompanyId = '90000000-0000-4000-8000-000000000001';
const validPosting = {
  empresaId: DEMO_COMPANY_ID,
  titulo: 'Desarrollador de software',
  modalidad: 'REMOTO',
  nivelExperiencia: 'Junior',
  descripcionTecnica: 'Desarrollo de aplicaciones con TypeScript, pruebas y trabajo en equipo.',
};

describe('Empresas y vacantes con autenticación y permisos compartidos', () => {
  let app: INestApplication;
  let auth: InMemoryAuthStore;
  const companies = new InMemoryCompanyProfileRepository();
  const jobs = new InMemoryJobPostingRepository(companies);
  const invitations = {
    findCompanyName: jest.fn().mockResolvedValue('Empresa de demostración'),
    create: jest
      .fn<Promise<MemberInvitationResult>, [NewCompanyMemberInvitation]>()
      .mockResolvedValue({ status: 'created', invitationId: 'invitation-id' }),
  };

  beforeAll(async () => {
    const passwords = new Argon2PasswordHasher();
    const hashes = new Map(
      await Promise.all(
        DEMO_ACCOUNTS.map(
          async (account) => [account.email, await passwords.hash(account.password)] as const,
        ),
      ),
    );
    auth = new InMemoryAuthStore(hashes);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(RedisService)
      .useValue({})
      .overrideProvider(CREDENTIAL_REPOSITORY)
      .useValue(auth)
      .overrideProvider(SESSION_REPOSITORY)
      .useValue(auth)
      .overrideProvider(USER_READER)
      .useValue(auth)
      .overrideProvider(RATE_LIMITER)
      .useValue({
        consume: async () => ({ allowed: true, retryAfterSeconds: 0 }),
      })
      .overrideProvider(COMPANY_PROFILE_REPOSITORY)
      .useValue(companies)
      .overrideProvider(JOB_POSTING_REPOSITORY)
      .useValue(jobs)
      .overrideProvider(COMPANY_MEMBER_INVITATION_REPOSITORY)
      .useValue(invitations)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureHttp(app);
    await app.init();
  });

  beforeEach(() => {
    auth.reset();
    companies.reset();
    jobs.postings.clear();
    invitations.create
      .mockClear()
      .mockResolvedValue({ status: 'created', invitationId: 'invitation-id' });
  });
  afterAll(async () => app?.close());

  async function login(account = DEMO_ACCOUNTS[2]) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: account.email, password: account.password })
      .expect(200);
    const cookies = (response.headers['set-cookie'] as unknown as string[]).map(
      (item) => item.split(';')[0],
    );
    const csrf = decodeURIComponent(
      cookies.find((item) => item.startsWith('umsspira_csrf='))!.split('=')[1],
    );
    return { token: response.body.data.accessToken as string, cookies, csrf };
  }

  it('HU-03 exige sesión y respeta el contrato existente al invitar', async () => {
    const route = companyRoot + '/users/invitations';
    const data = { nombre: 'Persona Invitada', correo: 'persona@example.test', rol: 'Reclutador' };
    await request(app.getHttpServer()).post(route).send(data).expect(401);
    const session = await login();
    const response = await request(app.getHttpServer())
      .post(route)
      .auth(session.token, { type: 'bearer' })
      .send(data)
      .expect(201);
    expect(response.body.data).toMatchObject({
      ...data,
      id: 'invitation-id',
      id_usuario: null,
      estado: 'Pendiente',
      esTitular: false,
    });
    expect(invitations.create).toHaveBeenCalledTimes(1);
  });

  it('HU-03 rechaza nombres fuera de la columna real sin crear invitación', async () => {
    const session = await login();
    await request(app.getHttpServer())
      .post(companyRoot + '/users/invitations')
      .auth(session.token, { type: 'bearer' })
      .send({ nombre: 'A'.repeat(121), correo: 'persona@example.test', rol: 'Reclutador' })
      .expect(400);
    expect(invitations.create).not.toHaveBeenCalled();
  });

  it('HU-03 no permite invitar para una empresa ajena', async () => {
    const session = await login();
    await request(app.getHttpServer())
      .post(`/api/v1/companies/${foreignCompanyId}/users/invitations`)
      .auth(session.token, { type: 'bearer' })
      .send({ nombre: 'Persona', correo: 'persona@example.test', rol: 'Administrador' })
      .expect(403);
    expect(invitations.create).not.toHaveBeenCalled();
  });

  it.each([
    ['forbidden', 403],
    ['pending', 409],
    ['email_in_use', 409],
  ] as const)('HU-03 responde %s sin convertirlo en 500', async (status, httpStatus) => {
    invitations.create.mockResolvedValue({ status });
    const session = await login();
    await request(app.getHttpServer())
      .post(companyRoot + '/users/invitations')
      .auth(session.token, { type: 'bearer' })
      .send({ nombre: 'Persona', correo: 'persona@example.test', rol: 'Administrador' })
      .expect(httpStatus);
  });

  it('protege las cuatro operaciones por defecto', async () => {
    await request(app.getHttpServer())
      .get(companyRoot + '/header')
      .expect(401);
    await request(app.getHttpServer())
      .get(companyRoot + '/contact')
      .expect(401);
    await request(app.getHttpServer())
      .put(companyRoot + '/profile')
      .send({ eslogan: 'Texto' })
      .expect(401);
    await request(app.getHttpServer()).post('/api/v1/job-postings').send(validPosting).expect(401);
  });

  it('devuelve encabezado y contacto con sus campos, incluidos nulos', async () => {
    const session = await login();
    await request(app.getHttpServer())
      .get(companyRoot + '/header')
      .auth(session.token, { type: 'bearer' })
      .expect(200, {
        data: {
          nombre: 'Empresa de demostración',
          eslogan: null,
          logoUrl: null,
          bannerUrl: null,
        },
      });
    await request(app.getHttpServer())
      .get(companyRoot + '/contact')
      .auth(session.token, { type: 'bearer' })
      .expect(200, {
        data: {
          description: null,
          taxId: '123456789',
          companySize: null,
          address: null,
          email: 'empresa@umss.edu.bo',
          phone: null,
          website: null,
        },
      });
  });

  it('actualiza campos enviados, normaliza entradas y conserva el NIT', async () => {
    const session = await login();
    const updated = await request(app.getHttpServer())
      .put(companyRoot + '/profile')
      .auth(session.token, { type: 'bearer' })
      .send({
        razonSocial: '  Empresa actualizada  ',
        correo: ' CONTACTO@EMPRESA.EXAMPLE ',
        telefono: '+591 72222222',
        direccion: 'Av. de demostración 123',
        sitioWeb: 'https://empresa.example',
      })
      .expect(200);
    expect(updated.body.data).toMatchObject({
      id: DEMO_COMPANY_ID,
      razon_social: 'Empresa actualizada',
      correo: 'contacto@empresa.example',
      nit: '123456789',
    });
    expect(updated.body.data).not.toHaveProperty('ownerId');
    expect(updated.body.data).not.toHaveProperty('id_usuario');
    const contact = await request(app.getHttpServer())
      .get(companyRoot + '/contact')
      .auth(session.token, { type: 'bearer' })
      .expect(200);
    expect(contact.body.data).toMatchObject({
      email: 'contacto@empresa.example',
      phone: '+591 72222222',
      address: 'Av. de demostración 123',
    });
    await request(app.getHttpServer())
      .put(companyRoot + '/profile')
      .auth(session.token, { type: 'bearer' })
      .send({ eslogan: '' })
      .expect(200);
    expect(companies.companies.get(DEMO_COMPANY_ID)?.legalName).toBe('Empresa actualizada');
  });

  it.each([
    {},
    { nit: 'otro' },
    { NIT_RUC: 'otro' },
    { id_usuario: DEMO_ACCOUNTS[1].id },
    { razonSocial: '   ' },
    { correo: 'invalido' },
    { sitioWeb: 'ftp://empresa.example' },
    { telefono: '-------' },
    { direccion: null },
    { descripcionLarga: 'a'.repeat(2001) },
  ])('rechaza actualizaciones inválidas sin escribir: %j', async (body) => {
    const session = await login();
    const response = await request(app.getHttpServer())
      .put(companyRoot + '/profile')
      .auth(session.token, { type: 'bearer' })
      .send(body)
      .expect(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(companies.companies.get(DEMO_COMPANY_ID)?.legalName).toBe('Empresa de demostración');
  });

  it.each([DEMO_ACCOUNTS[0], DEMO_ACCOUNTS[1]])(
    'rechaza acceso por rol sin permisos: $role',
    async (account) => {
      const session = await login(account);
      await request(app.getHttpServer())
        .get(companyRoot + '/header')
        .auth(session.token, { type: 'bearer' })
        .expect(403);
      await request(app.getHttpServer())
        .put(companyRoot + '/profile')
        .auth(session.token, { type: 'bearer' })
        .send({ eslogan: 'Texto' })
        .expect(403);
      await request(app.getHttpServer())
        .post('/api/v1/job-postings')
        .auth(session.token, { type: 'bearer' })
        .send(validPosting)
        .expect(403);
      expect(jobs.postings.size).toBe(0);
    },
  );

  it('tener permiso no sustituye el scope y los headers no permiten suplantar propiedad', async () => {
    const session = await login();
    await request(app.getHttpServer())
      .get('/api/v1/companies/' + foreignCompanyId + '/header')
      .auth(session.token, { type: 'bearer' })
      .set('x-company-id', DEMO_COMPANY_ID)
      .set('x-user-id', DEMO_ACCOUNTS[2].id)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/job-postings')
      .auth(session.token, { type: 'bearer' })
      .set('x-company-id', DEMO_COMPANY_ID)
      .send({ ...validPosting, empresaId: foreignCompanyId })
      .expect(403);
    expect(jobs.postings.size).toBe(0);
  });

  it('comprueba propiedad en persistencia aunque el scope de prueba esté desactualizado', async () => {
    const session = await login();
    companies.companies.get(DEMO_COMPANY_ID)!.ownerId = DEMO_ACCOUNTS[1].id;
    const response = await request(app.getHttpServer())
      .get(companyRoot + '/header')
      .auth(session.token, { type: 'bearer' })
      .expect(404);
    expect(response.body.error.code).toBe('COMPANY_NOT_FOUND');
    await request(app.getHttpServer())
      .post('/api/v1/job-postings')
      .auth(session.token, { type: 'bearer' })
      .send(validPosting)
      .expect(404);
    expect(jobs.postings.size).toBe(0);
  });

  it('separa permiso de lectura y escritura y aplica cambios a la siguiente petición', async () => {
    const session = await login();
    const user = auth.users.get(DEMO_ACCOUNTS[2].id)!;
    user.actor.permissions = ['user:self:read', 'empresas:self:read'];
    await request(app.getHttpServer())
      .get(companyRoot + '/header')
      .auth(session.token, { type: 'bearer' })
      .expect(200);
    await request(app.getHttpServer())
      .put(companyRoot + '/profile')
      .auth(session.token, { type: 'bearer' })
      .send({ eslogan: 'Texto' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/job-postings')
      .auth(session.token, { type: 'bearer' })
      .send(validPosting)
      .expect(403);
  });

  it('valida UUID de rutas y body usando Zod', async () => {
    const session = await login();
    await request(app.getHttpServer())
      .get('/api/v1/companies/incorrecto/header')
      .auth(session.token, { type: 'bearer' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/job-postings')
      .auth(session.token, { type: 'bearer' })
      .send({ ...validPosting, empresaId: 'incorrecto' })
      .expect(400);
  });

  it('publica con la empresa real, UUID y estado definido por el servidor', async () => {
    const session = await login();
    const response = await request(app.getHttpServer())
      .post('/api/v1/job-postings')
      .auth(session.token, { type: 'bearer' })
      .send(validPosting)
      .expect(201);
    expect(response.body.data).toEqual({
      id: expect.any(String),
      titulo: validPosting.titulo,
      modalidad: validPosting.modalidad,
      nivelExperiencia: validPosting.nivelExperiencia,
      descripcionTecnica: validPosting.descripcionTecnica,
      estado: 'PUBLICADO',
      fechaCreacion: expect.any(String),
      empresaId: DEMO_COMPANY_ID,
    });
    expect(z.uuid().safeParse(response.body.data.id).success).toBe(true);
    expect(response.body.data.empresaId).not.toBe(DEMO_ACCOUNTS[2].id);
    expect(jobs.postings.size).toBe(1);
  });

  it.each([
    { modalidad: 'OTRA' },
    { titulo: '   ' },
    { titulo: 'a'.repeat(151) },
    { nivelExperiencia: '' },
    { descripcionTecnica: 'corta' },
    { descripcionTecnica: ' '.repeat(60) },
    { descripcionTecnica: 'a'.repeat(20001) },
    { estado: 'CERRADO' },
    { usuarioId: DEMO_ACCOUNTS[1].id },
  ])('rechaza una vacante inválida sin publicarla: %j', async (patch) => {
    const session = await login();
    await request(app.getHttpServer())
      .post('/api/v1/job-postings')
      .auth(session.token, { type: 'bearer' })
      .send({ ...validPosting, ...patch })
      .expect(400);
    expect(jobs.postings.size).toBe(0);
  });

  it('aplica CSRF global a PUT y POST autenticados con cookies', async () => {
    const session = await login();
    await request(app.getHttpServer())
      .put(companyRoot + '/profile')
      .set('Cookie', session.cookies)
      .send({ eslogan: 'Texto' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/job-postings')
      .set('Cookie', session.cookies)
      .send(validPosting)
      .expect(403);
    await request(app.getHttpServer())
      .put(companyRoot + '/profile')
      .set('Cookie', session.cookies)
      .set('X-CSRF-Token', session.csrf)
      .send({ eslogan: 'Texto' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/job-postings')
      .set('Cookie', session.cookies)
      .set('X-CSRF-Token', session.csrf)
      .send(validPosting)
      .expect(201);
  });
});
