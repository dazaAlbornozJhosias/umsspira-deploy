import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { z } from 'zod';
import { AppModule } from '../src/app.module';
import { Argon2PasswordHasher } from '../src/modules/auth/infrastructure/security/argon2-password.hasher';
import { CREDENTIAL_REPOSITORY } from '../src/modules/auth/application/ports/credential-repository.port';
import { SESSION_REPOSITORY } from '../src/modules/auth/application/ports/session-repository.port';
import { RATE_LIMITER } from '../src/modules/auth/application/ports/rate-limiter.port';
import { USER_READER } from '../src/modules/user/application/ports/user-reader.port';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { RedisService } from '../src/shared/infrastructure/redis/redis.service';
import { DependencyUnavailableError } from '../src/shared/errors/dependency-unavailable-error';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { DEMO_ACCOUNTS } from '../scripts/seed/demo-accounts';
import { InMemoryAuthStore } from './adapters/in-memory-auth.store';

interface LoginResult {
  token: string;
  cookies: string[];
  csrf: string;
  response: request.Response;
}

describe('Flujos HTTP de autenticación propia', () => {
  let app: INestApplication;
  let store: InMemoryAuthStore;
  const consume = jest.fn();

  beforeAll(async () => {
    const passwords = new Argon2PasswordHasher();
    const hashes = new Map(
      await Promise.all(
        DEMO_ACCOUNTS.map(
          async (account) => [account.email, await passwords.hash(account.password)] as const,
        ),
      ),
    );
    store = new InMemoryAuthStore(hashes);

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn() })
      .overrideProvider(RedisService)
      .useValue({})
      .overrideProvider(CREDENTIAL_REPOSITORY)
      .useValue(store)
      .overrideProvider(SESSION_REPOSITORY)
      .useValue(store)
      .overrideProvider(USER_READER)
      .useValue(store)
      .overrideProvider(RATE_LIMITER)
      .useValue({ consume })
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureHttp(app);
    await app.init();
  });

  beforeEach(() => {
    store.reset();
    consume.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  afterAll(async () => app?.close());

  async function login(
    email = 'admin@umss.edu.bo',
    password = 'admin1234',
    remember = false,
  ): Promise<LoginResult> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password, remember })
      .expect(200);
    const cookies = (response.headers['set-cookie'] as unknown as string[]).map(
      (cookie) => cookie.split(';')[0],
    );
    const csrf = decodeURIComponent(
      cookies.find((cookie) => cookie.startsWith('umsspira_csrf='))!.split('=')[1],
    );
    return { token: response.body.data.accessToken, cookies, csrf, response };
  }

  it.each(DEMO_ACCOUNTS)('login y me exponen identidad y permisos para $role', async (account) => {
    const session = await login(account.email, account.password);
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(session.token, { type: 'bearer' })
      .expect(200);
    expect(me.body.data).toEqual({
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      permissions: expect.arrayContaining(['user:self:read', 'auth:sessions:self']),
      scopes: {
        companyIds: expect.any(Array),
        careerIds: expect.any(Array),
        graduateId: account.role === 'titulado' ? expect.any(String) : null,
      },
    });
    expect(z.uuid().safeParse(me.body.data.id).success).toBe(true);
    expect(JSON.stringify(me.body)).not.toMatch(/password|csrfHash|credentialVersion|refreshToken/);
    expect(session.response.body.data).not.toHaveProperty('refreshToken');
    expect(session.response.headers['cache-control']).toBe('no-store');
    const cookies = session.response.headers['set-cookie'] as unknown as string[];
    expect(cookies.filter((cookie) => cookie.includes('HttpOnly'))).toHaveLength(2);
    expect(cookies.every((cookie) => cookie.includes('SameSite=Lax'))).toBe(true);
    const userMe = await request(app.getHttpServer())
      .get('/api/v1/user/me')
      .auth(session.token, { type: 'bearer' })
      .expect(200);
    expect(userMe.body).toEqual(me.body);
  });

  it('no distingue correo inexistente de contraseña incorrecta y rechaza asignarse un rol', async () => {
    const wrong = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@umss.edu.bo', password: 'incorrecta' })
      .expect(401);
    const missing = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nadie@umss.edu.bo', password: 'incorrecta' })
      .expect(401);
    expect(missing.body).toEqual(wrong.body);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@umss.edu.bo', password: 'admin1234', role: 'administrador' })
      .expect(400);
  });

  it('consulta sesión sin rotar y revoca la familia si se reutiliza un refresh', async () => {
    const first = await login();
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', first.cookies)
      .expect(200);
    expect([...store.refreshes.values()].every((token) => !token.consumed)).toBe(true);
    const rotated = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', first.cookies)
      .set('X-CSRF-Token', first.csrf)
      .expect(200);
    const nextCookies = (rotated.headers['set-cookie'] as unknown as string[]).map(
      (cookie) => cookie.split(';')[0],
    );
    expect(nextCookies.find((cookie) => cookie.startsWith('umsspira_refresh='))).not.toBe(
      first.cookies.find((cookie) => cookie.startsWith('umsspira_refresh=')),
    );
    const replay = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', first.cookies)
      .set('X-CSRF-Token', first.csrf)
      .expect(401);
    expect(replay.body.error.code).toBe('SESSION_REUSED');
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(first.token, { type: 'bearer' })
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(rotated.body.data.accessToken, { type: 'bearer' })
      .expect(401);
  });

  it('exige CSRF por cookie y no permite renovar desde un origen ajeno', async () => {
    const session = await login();
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', session.cookies)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', session.cookies)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', session.cookies)
      .set('X-CSRF-Token', session.csrf)
      .set('Origin', 'https://ajeno.example')
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', session.cookies)
      .set('X-CSRF-Token', session.csrf)
      .expect(204);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(session.token, { type: 'bearer' })
      .expect(401);
  });

  it('lista solo sesiones propias, rechaza UUID inválido y no revoca sesiones ajenas', async () => {
    const admin = await login();
    const graduate = await login('titulado@umss.edu.bo', 'titulado1234');
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .auth(admin.token, { type: 'bearer' })
      .expect(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].current).toBe(true);
    expect(JSON.stringify(response.body)).not.toMatch(/csrfHash|refresh|credentialVersion|userId/);
    const graduateSession = [...store.sessions.values()].find(
      (session) => session.userId === DEMO_ACCOUNTS[0].id,
    )!;
    await request(app.getHttpServer())
      .delete('/api/v1/auth/sessions/' + graduateSession.id)
      .auth(admin.token, { type: 'bearer' })
      .expect(404);
    await request(app.getHttpServer())
      .delete('/api/v1/auth/sessions/no-es-uuid')
      .auth(admin.token, { type: 'bearer' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(graduate.token, { type: 'bearer' })
      .expect(200);
    await request(app.getHttpServer())
      .delete('/api/v1/auth/sessions/' + response.body.data[0].id)
      .auth(admin.token, { type: 'bearer' })
      .expect(204);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(admin.token, { type: 'bearer' })
      .expect(401);
  });

  it('logout-all revoca otros dispositivos y conserva las sesiones de otros usuarios', async () => {
    const one = await login();
    const two = await login();
    const company = await login('empresa@umss.edu.bo', 'empresa1234');
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .auth(one.token, { type: 'bearer' })
      .expect(204);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(one.token, { type: 'bearer' })
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(two.token, { type: 'bearer' })
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(company.token, { type: 'bearer' })
      .expect(200);
  });

  it('cambiar contraseña exige la anterior y revoca todas las sesiones del usuario', async () => {
    const one = await login();
    const two = await login();
    const newPassword = 'Nueva frase de acceso 2026';
    await request(app.getHttpServer())
      .post('/api/v1/auth/password')
      .auth(one.token, { type: 'bearer' })
      .send({ currentPassword: 'incorrecta', newPassword })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/password')
      .auth(one.token, { type: 'bearer' })
      .send({ currentPassword: 'admin1234', newPassword: 'corta' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/auth/password')
      .auth(one.token, { type: 'bearer' })
      .send({ currentPassword: 'admin1234', newPassword })
      .expect(204);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(two.token, { type: 'bearer' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@umss.edu.bo', password: 'admin1234' })
      .expect(401);
    await login('admin@umss.edu.bo', newPassword);
  });

  it('aplica cambios de permisos y bloqueo con el mismo JWT', async () => {
    const session = await login();
    const user = store.users.get(DEMO_ACCOUNTS[1].id)!;
    user.actor.permissions = [];
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(session.token, { type: 'bearer' })
      .expect(403);
    user.enabled = false;
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(session.token, { type: 'bearer' })
      .expect(401);
  });

  it('rechaza access alterado y sesiones vencidas', async () => {
    const session = await login();
    const parts = session.token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ sub: DEMO_ACCOUNTS[0].id })).toString('base64url');
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(parts.join('.'), { type: 'bearer' })
      .expect(401);
    [...store.sessions.values()][0].expiresAt = new Date(0);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(session.token, { type: 'bearer' })
      .expect(401);
  });

  it('comunica límite con Retry-After y no omite el control si falla Redis', async () => {
    consume.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 42 });
    const limited = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@umss.edu.bo', password: 'admin1234' })
      .expect(429);
    expect(limited.headers['retry-after']).toBe('42');
    consume.mockRejectedValueOnce(new DependencyUnavailableError());
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@umss.edu.bo', password: 'admin1234' })
      .expect(503);
    expect(store.sessions.size).toBe(0);
  });

  it('recordar agrega vencimiento a las cookies sin alargar la sesión al renovar', async () => {
    const temporary = await login();
    expect(
      (temporary.response.headers['set-cookie'] as unknown as string[]).every(
        (cookie) => !cookie.includes('Expires='),
      ),
    ).toBe(true);
    const remembered = await login('admin@umss.edu.bo', 'admin1234', true);
    expect(
      (remembered.response.headers['set-cookie'] as unknown as string[]).every((cookie) =>
        cookie.includes('Expires='),
      ),
    ).toBe(true);
    const previousExpiry = [...store.sessions.values()].map((session) =>
      session.expiresAt.getTime(),
    );
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', remembered.cookies)
      .set('X-CSRF-Token', remembered.csrf)
      .expect(200);
    expect([...store.sessions.values()].map((session) => session.expiresAt.getTime())).toEqual(
      previousExpiry,
    );
  });
});
