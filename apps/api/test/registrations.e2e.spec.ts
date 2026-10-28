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
import {
  REGISTRATION_SECURITY,
  type RegistrationSecurity,
} from '../src/modules/registrations/application/ports/registration-security.port';
import { BusinessRuleError } from '../src/shared/errors/business-rule-error';
import { issueActivationToken } from '../src/modules/registrations/application/security/activation-token';
const careerId = randomUUID();
const token = randomUUID();
const applicationId = randomUUID();
const data = {
  nombres: 'María',
  apellidos: 'Pérez',
  ci: '12345678',
  complementoCi: '',
  expedidoEn: 'CB',
  correo: 'maria@example.com',
  telefono: '77777777',
  carreraId: careerId,
  anioEgreso: 2025,
  codigoSis: '202012345',
};
const actor: ActorContext = {
  id: randomUUID(),
  name: 'Administración',
  email: 'admin@example.com',
  role: 'administrador',
  permissions: ['solicitudes:read', 'solicitudes:review'],
  scopes: { companyIds: [], careerIds: [careerId], graduateId: null },
  credentialVersion: 1,
};

describe('Registro documental: fronteras HTTP y permisos', () => {
  let app: INestApplication;
  let security: RegistrationSecurity;
  const repository = {
    listCareers: jest.fn(),
    createDraft: jest.fn(),
    updateDraft: jest.fn(),
    draftDocument: jest.fn(),
    findDraft: jest.fn(),
    issueCode: jest.fn(),
    verifyCode: jest.fn(),
    saveFile: jest.fn(),
    submit: jest.fn(),
  };
  const applications = {
    find: jest.fn(),
    list: jest.fn(),
    document: jest.fn(),
    review: jest.fn(),
    verifyActivation: jest.fn(),
    activate: jest.fn(),
    renewActivation: jest.fn(),
  };
  const limiter = { consume: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(REGISTRATION_REPOSITORY)
      .useValue(repository)
      .overrideProvider(APPLICATIONS_REPOSITORY)
      .useValue(applications)
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
    security = module.get(REGISTRATION_SECURITY);
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    limiter.consume.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    repository.findDraft.mockResolvedValue({
      id: randomUUID(),
      data,
      expiresAt: new Date(Date.now() + 7200000),
      verified: true,
      applicationId: null,
    });
  });
  afterAll(async () => app?.close());

  it('guarda el hash del token y normaliza el correo sin requerir login', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/registrations/sessions')
      .send({ ...data, correo: ' MARIA@EXAMPLE.COM ' })
      .expect(201);
    expect(repository.createDraft).toHaveBeenCalledWith(
      security.hash('draft', response.body.data.sessionToken),
      expect.objectContaining({ correo: 'maria@example.com' }),
      expect.any(Date),
    );
    expect(JSON.stringify(response.body)).not.toContain('ci');
  });

  it('actualiza el borrador por token y normaliza el correo nuevo', async () => {
    repository.updateDraft.mockResolvedValue({ verifiedEmail: data.correo });
    await request(app.getHttpServer())
      .patch('/api/v1/registrations/sessions/' + token)
      .send({ ...data, correo: ' NUEVO@EXAMPLE.COM ' })
      .expect(200);
    expect(repository.updateDraft).toHaveBeenCalledWith(
      security.hash('draft', token),
      expect.objectContaining({ correo: 'nuevo@example.com' }),
    );
  });

  it('no acepta que el cliente declare un correo como verificado', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/registrations/sessions/' + token)
      .send({ ...data, verifiedEmail: data.correo })
      .expect(400);
    expect(repository.updateDraft).not.toHaveBeenCalled();
  });

  it('recupera el documento con el token del borrador y sin caché pública', async () => {
    repository.draftDocument.mockResolvedValue({
      mime: 'application/pdf',
      bytes: Buffer.from('%PDF-1.4'),
    });
    const response = await request(app.getHttpServer())
      .get('/api/v1/registrations/sessions/' + token + '/document')
      .expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(repository.draftDocument).toHaveBeenCalledWith(security.hash('draft', token));
  });

  it('valida UUID y rechaza campos de privilegios antes de persistir', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/registrations/sessions')
      .send({ ...data, carreraId: 'otra-carrera', rol: 'administrador' })
      .expect(400);
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it('bloquea solicitudes desde un origen ajeno', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/registrations/sessions')
      .set('Origin', 'https://otro.example')
      .send(data)
      .expect(403);
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it('aplica el limitador antes de crear borradores', async () => {
    limiter.consume.mockResolvedValue({ allowed: false, retryAfterSeconds: 300 });
    await request(app.getHttpServer())
      .post('/api/v1/registrations/sessions')
      .send(data)
      .expect(429);
    expect(repository.createDraft).not.toHaveBeenCalled();
  });

  it('devuelve 410 para borradores vencidos y no revela sus datos', async () => {
    repository.findDraft.mockResolvedValue(null);
    await request(app.getHttpServer())
      .get('/api/v1/registrations/sessions/' + token)
      .expect(410);
  });

  it.each([
    ['incorrect', 400, 'INVALID_CODE'],
    ['expired', 410, 'CODE_EXPIRED'],
    ['locked', 429, 'CODE_ATTEMPTS_EXCEEDED'],
  ])('traduce el resultado OTP %s sin exponer el hash', async (result, status, code) => {
    repository.verifyCode.mockResolvedValue(result);
    const response = await request(app.getHttpServer())
      .post('/api/v1/email-verification/verify')
      .send({ registrationId: token, code: '123456' })
      .expect(status);
    expect(response.body.error.code).toBe(code);
    expect(repository.verifyCode).toHaveBeenCalledWith(
      security.hash('draft', token),
      security.hash('otp', token + ':123456'),
    );
  });

    it('entrega un pase de activación sin exponer el hash del código', async () => {
    applications.verifyActivation.mockResolvedValue({
      result: 'verified',
      binding: 'hash-vigente-secreto',
    });
    const response = await request(app.getHttpServer())
      .post('/api/v1/registrations/activate/verify')
      .send({ applicationId, code: '123456' })
      .expect(200);
    expect(response.body.data.activationToken).toEqual(expect.any(String));
    expect(response.body.data.expiresInSeconds).toBe(600);
    expect(JSON.stringify(response.body)).not.toContain('hash-vigente-secreto');
    expect(applications.verifyActivation).toHaveBeenCalledWith(
      applicationId,
      security.hash('activation', applicationId + ':123456'),
    );
  });

  it.each([
    ['invalid', 400, 'INVALID_ACTIVATION'],
    ['expired', 410, 'ACTIVATION_EXPIRED'],
    ['locked', 429, 'ACTIVATION_ATTEMPTS_EXCEEDED'],
  ])('traduce el resultado de activación %s sin emitir pase', async (result, status, code) => {
    applications.verifyActivation.mockResolvedValue({ result });
    const response = await request(app.getHttpServer())
      .post('/api/v1/registrations/activate/verify')
      .send({ applicationId, code: '123456' })
      .expect(status);
    expect(response.body.error.code).toBe(code);
    expect(response.body.data).toBeUndefined();
  });

  it('rechaza códigos mal formados y campos extra antes de consultar la solicitud', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/registrations/activate/verify')
      .send({ applicationId, code: '12345' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/registrations/activate/verify')
      .send({ applicationId, code: '123456', password: 'no-corresponde-al-paso-1' })
      .expect(400);
    expect(applications.verifyActivation).not.toHaveBeenCalled();
  });

    it('activa la cuenta con el pase del paso 1 y entrega al repositorio solo el hash de la contraseña', async () => {
    applications.activate.mockImplementation(async (_id, _hash, matches) =>
      matches('hash-vigente') ? 'activated' : 'invalid',
    );
    const activationToken = issueActivationToken(security, applicationId, 'hash-vigente');
    const response = await request(app.getHttpServer())
      .post('/api/v1/registrations/activate')
      .send({ applicationId, activationToken, password: 'Abcdef1!' })
      .expect(200);
    expect(response.body.data).toEqual({ activated: true });
    const [, passwordHash] = applications.activate.mock.calls[0];
    expect(passwordHash).not.toContain('Abcdef1!');
  });

  it('rechaza el pase de otra solicitud y el firmado con un código anterior', async () => {
    applications.activate.mockImplementation(async (_id, _hash, matches) =>
      matches('hash-vigente') ? 'activated' : 'invalid',
    );
    const foreign = issueActivationToken(security, randomUUID(), 'hash-vigente');
    const first = await request(app.getHttpServer())
      .post('/api/v1/registrations/activate')
      .send({ applicationId, activationToken: foreign, password: 'Abcdef1!' })
      .expect(400);
    expect(first.body.error.code).toBe('INVALID_ACTIVATION_TOKEN');
    expect(applications.activate).not.toHaveBeenCalled();
    const stale = issueActivationToken(security, applicationId, 'hash-anterior');
    const second = await request(app.getHttpServer())
      .post('/api/v1/registrations/activate')
      .send({ applicationId, activationToken: stale, password: 'Abcdef1!' })
      .expect(400);
    expect(second.body.error.code).toBe('INVALID_ACTIVATION');
  });

  it('pide validar el código otra vez cuando el pase venció', async () => {
    const expired = issueActivationToken(
      security,
      applicationId,
      'hash-vigente',
      Date.now() - 11 * 60 * 1000,
    );
    const response = await request(app.getHttpServer())
      .post('/api/v1/registrations/activate')
      .send({ applicationId, activationToken: expired, password: 'Abcdef1!' })
      .expect(410);
    expect(response.body.error.code).toBe('ACTIVATION_TOKEN_EXPIRED');
    expect(applications.activate).not.toHaveBeenCalled();
  });

  it('no acepta el código en el paso 2 ni contraseñas que incumplen la política', async () => {
    const activationToken = issueActivationToken(security, applicationId, 'hash-vigente');
    await request(app.getHttpServer())
      .post('/api/v1/registrations/activate')
      .send({ applicationId, activationToken, code: '123456', password: 'Abcdef1!' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/registrations/activate')
      .send({ applicationId, activationToken, password: 'sinmayuscula1!' })
      .expect(400);
    expect(applications.activate).not.toHaveBeenCalled();
  });

  it.each([
    ['already', 'ACTIVATION_ALREADY_DONE'],
    ['account-exists', 'ACCOUNT_ALREADY_EXISTS'],
  ])('responde 409 cuando el resultado es %s', async (result, code) => {
    applications.activate.mockResolvedValue(result);
    const activationToken = issueActivationToken(security, applicationId, 'hash-vigente');
    const response = await request(app.getHttpServer())
      .post('/api/v1/registrations/activate')
      .send({ applicationId, activationToken, password: 'Abcdef1!' })
      .expect(409);
    expect(response.body.error.code).toBe(code);
  });

  it('bloquea archivos disfrazados aunque declaren application/pdf', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/documents')
      .field('sessionToken', token)
      .field('tipoDocumento', 'certificado_egreso')
      .attach('archivo', Buffer.from('MZ ejecutable'), {
        filename: 'respaldo.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    expect(repository.saveFile).not.toHaveBeenCalled();
  });

  it('exige correo verificado antes de guardar un respaldo', async () => {
    repository.findDraft.mockResolvedValue({
      id: randomUUID(),
      data,
      expiresAt: new Date(Date.now() + 7200000),
      verified: false,
      applicationId: null,
    });
    await request(app.getHttpServer())
      .post('/api/v1/documents')
      .field('sessionToken', token)
      .field('tipoDocumento', 'certificado_egreso')
      .attach('archivo', Buffer.from('%PDF-1.7\ncontenido'), 'respaldo.pdf')
      .expect(403);
    expect(repository.saveFile).not.toHaveBeenCalled();
  });

  it('impide consultar expedientes sin sesión o sin permiso', async () => {
    await request(app.getHttpServer()).get('/api/v1/applications').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/applications')
      .set('Authorization', 'Bearer empresa')
      .expect(403);
    expect(applications.list).not.toHaveBeenCalled();
  });

  it('entrega al repositorio el alcance verificado, sin aceptar cabeceras de identidad', async () => {
    applications.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 15 });
    await request(app.getHttpServer())
      .get('/api/v1/applications')
      .set('Authorization', 'Bearer admin')
      .set('x-user-id', randomUUID())
      .expect(200);
    expect(applications.list).toHaveBeenCalledWith(actor, { page: 1, pageSize: 15 });
  });

  it('no admite rechazar u observar sin justificación', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/applications/' + applicationId + '/review')
      .set('Authorization', 'Bearer admin')
      .send({ decision: 'RECHAZADA' })
      .expect(400);
    expect(applications.review).not.toHaveBeenCalled();
  });

  it('acepta el dictamen en español y conserva el contrato de notificación', async () => {
    applications.find.mockResolvedValueOnce({ email: 'maria@example.com', fullName: 'Maria Rojas' });
    applications.review.mockResolvedValueOnce({
      id: randomUUID(),
      applicationId,
      decision: 'APROBADA',
      status: 'APROBADA',
      notificationStatus: 'EN_COLA',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/applications/' + applicationId + '/review')
      .set('Authorization', 'Bearer admin')
      .send({ decision: 'APROBADA' })
      .expect(201);

    expect(response.body.data.status).toBe('APROBADA');
    expect(response.body.data.notificationStatus).toBe('EN_COLA');
    expect(applications.review).toHaveBeenCalledWith(
      actor,
      applicationId,
      { decision: 'APROBADA' },
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ type: 'aprobacion' }),
    );
  });

  it('rechaza los estados anteriores en inglés antes de llamar al repositorio', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/applications/' + applicationId + '/review')
      .set('Authorization', 'Bearer admin')
      .send({ decision: 'APPROVED' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/applications?status=PENDING')
      .set('Authorization', 'Bearer admin')
      .expect(400);

    expect(applications.find).not.toHaveBeenCalled();
    expect(applications.review).not.toHaveBeenCalled();
    expect(applications.list).not.toHaveBeenCalled();
  });

  it('mantiene privado el contenido del respaldo', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/applications/' + applicationId + '/document/content')
      .expect(401);
    applications.document.mockRejectedValue(
      new BusinessRuleError('missing', 'DOCUMENT_NOT_FOUND', 'No se encontró el respaldo'),
    );
    await request(app.getHttpServer())
      .get('/api/v1/applications/' + applicationId + '/document/content')
      .set('Authorization', 'Bearer admin')
      .expect(404);
  });
});
