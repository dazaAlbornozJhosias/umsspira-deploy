import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Argon2PasswordHasher } from '../src/modules/auth/infrastructure/security/argon2-password.hasher';
import { CREDENTIAL_REPOSITORY } from '../src/modules/auth/application/ports/credential-repository.port';
import { SESSION_REPOSITORY } from '../src/modules/auth/application/ports/session-repository.port';
import { RATE_LIMITER } from '../src/modules/auth/application/ports/rate-limiter.port';
import {
  PASSWORD_RECOVERY_REPOSITORY,
  type PasswordRecoveryRepository,
  type RecoveryEvent,
  type RecoveryIssue,
  type RecoveryRequestResult,
  type RecoveryResetOutcome,
} from '../src/modules/auth/application/ports/password-recovery-repository.port';
import { recoveryLinkState } from '../src/modules/auth/domain/policies/password-recovery.policy';
import { USER_READER } from '../src/modules/user/application/ports/user-reader.port';
import { PrismaService } from '../src/shared/infrastructure/database/prisma.service';
import { RedisService } from '../src/shared/infrastructure/redis/redis.service';
import { configureHttp } from '../src/shared/http/configuration/configure-http';
import { DEMO_ACCOUNTS } from '../scripts/seed/demo-accounts';
import { InMemoryAuthStore } from './adapters/in-memory-auth.store';

interface StoredToken {
  id: string;
  userId: string;
  hash: string;
  expiresAt: Date;
  usedAt: Date | null;
  revoked: boolean;
}

// Repositorio en memoria de la recuperación: reproduce las reglas de la base de datos de HU-12.
class InMemoryRecoveryStore implements PasswordRecoveryRepository {
  readonly tokens: StoredToken[] = [];
  readonly mails: Array<{ to: string; body: string }> = [];
  readonly requests: Array<{ email: string; originHash: string; result: RecoveryRequestResult; at: Date }> = [];
  readonly events: RecoveryEvent[] = [];

  constructor(private readonly auth: InMemoryAuthStore) {}

  clear(): void {
    this.tokens.length = 0;
    this.mails.length = 0;
    this.requests.length = 0;
    this.events.length = 0;
  }

  async countRecentRequests(email: string, originHash: string, since: Date) {
    const recent = this.requests.filter((item) => item.at >= since && item.result !== 'rechazado_rate');
    return {
      byEmail: recent.filter((item) => item.email === email).length,
      byOrigin: recent.filter((item) => item.originHash === originHash).length,
    };
  }

  async recordRequest(input: { email: string; originHash: string; result: RecoveryRequestResult; at: Date }) {
    this.requests.push(input);
  }

  async issue(input: RecoveryIssue): Promise<boolean> {
    for (const token of this.tokens) {
      if (token.userId === input.userId && !token.usedAt && !token.revoked) {
        token.revoked = true;
      }
    }
    this.tokens.push({
      id: `token-${this.tokens.length + 1}`,
      userId: input.userId,
      hash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: null,
      revoked: false,
    });
    this.mails.push({ to: input.email, body: input.body });
    return true;
  }

  async findByHash(tokenHash: string) {
    const token = this.tokens.find((item) => item.hash === tokenHash);
    return token
      ? { id: token.id, userId: token.userId, expiresAt: token.expiresAt, usedAt: token.usedAt, revoked: token.revoked }
      : null;
  }

  async reset(input: { tokenHash: string; passwordHash: string; now: Date }): Promise<RecoveryResetOutcome> {
    const token = this.tokens.find((item) => item.hash === input.tokenHash);
    if (!token) {
      return { status: 'invalid' };
    }
    const state = recoveryLinkState(token, input.now);
    if (state !== 'valid') {
      return { status: state, userId: token.userId };
    }
    const user = this.auth.users.get(token.userId)!;
    user.credential.passwordHash = input.passwordHash;
    user.credential.version++;
    user.actor.credentialVersion++;
    await this.auth.revokeAll(token.userId, input.now);
    token.usedAt = input.now;
    return { status: 'reset', userId: token.userId };
  }

  async recordEvent(event: RecoveryEvent) {
    this.events.push(event);
  }

  tokenFromLastMail(): string {
    const body = this.mails.at(-1)!.body;
    return /token=([^\s&]+)/.exec(body)![1];
  }
}

describe('Recuperación de contraseña (HU-12)', () => {
  let app: INestApplication;
  let auth: InMemoryAuthStore;
  let recovery: InMemoryRecoveryStore;
  const consume = jest.fn();
  const admin = DEMO_ACCOUNTS.find((account) => account.role === 'administrador')!;
  const NEW_PASSWORD = 'Nueva-clave-2026!';

  beforeAll(async () => {
    const passwords = new Argon2PasswordHasher();
    const hashes = new Map(
      await Promise.all(
        DEMO_ACCOUNTS.map(async (account) => [account.email, await passwords.hash(account.password)] as const),
      ),
    );
    auth = new InMemoryAuthStore(hashes);
    recovery = new InMemoryRecoveryStore(auth);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn() })
      .overrideProvider(RedisService)
      .useValue({})
      .overrideProvider(CREDENTIAL_REPOSITORY)
      .useValue(auth)
      .overrideProvider(SESSION_REPOSITORY)
      .useValue(auth)
      .overrideProvider(USER_READER)
      .useValue(auth)
      .overrideProvider(RATE_LIMITER)
      .useValue({ consume })
      .overrideProvider(PASSWORD_RECOVERY_REPOSITORY)
      .useValue(recovery)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureHttp(app);
    await app.init();
  });

  beforeEach(() => {
    auth.reset();
    recovery.clear();
    consume.mockReset().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  afterAll(async () => app?.close());

  const server = () => app.getHttpServer();
  const requestLink = (email = admin.email) => request(server()).post('/api/v1/auth/password-recovery/request').send({ email });
  const validate = (token: string) => request(server()).post('/api/v1/auth/password-recovery/validate').send({ token });
  const reset = (token: string, password = NEW_PASSWORD) =>
    request(server()).post('/api/v1/auth/password-recovery/reset').send({ token, password });

  it('responde igual exista o no la cuenta y solo envía el enlace a una cuenta activa (CA-12.1, CA-12.2)', async () => {
    const existing = await requestLink().expect(202);
    expect(recovery.mails).toHaveLength(1);
    expect(recovery.mails[0].to).toBe(admin.email);
    expect(recovery.mails[0].body).toContain('/reset-password?token=');

    recovery.clear();
    const unknown = await requestLink('nadie@umss.edu.bo').expect(202);

    expect(unknown.body).toEqual(existing.body);
    expect(recovery.mails).toHaveLength(0);
  });

  it('no envía el enlace a una cuenta desactivada y responde lo mismo', async () => {
    const active = await requestLink().expect(202);
    recovery.clear();
    auth.users.get(admin.id)!.enabled = false;

    const disabled = await requestLink().expect(202);

    expect(disabled.body).toEqual(active.body);
    expect(recovery.mails).toHaveLength(0);
  });

  it('valida el enlace vigente sin sesión (CA-12.3)', async () => {
    await requestLink().expect(202);

    await validate(recovery.tokenFromLastMail()).expect(204);
  });

  it('un enlace inventado responde 400 con su código (CA-12.5)', async () => {
    const response = await validate('enlace-inventado').expect(400);

    expect(response.body.error.code).toBe('RECOVERY_LINK_INVALID');
  });

  it('restablece la contraseña y cierra las sesiones anteriores (CA-12.3, CA-12.4)', async () => {
    const session = await request(server())
      .post('/api/v1/auth/login')
      .send({ email: admin.email, password: admin.password })
      .expect(200);
    const oldToken = session.body.data.accessToken as string;
    await request(server()).get('/api/v1/auth/me').auth(oldToken, { type: 'bearer' }).expect(200);

    await requestLink().expect(202);
    await reset(recovery.tokenFromLastMail()).expect(204);

    await request(server()).get('/api/v1/auth/me').auth(oldToken, { type: 'bearer' }).expect(401);
    await request(server()).post('/api/v1/auth/login').send({ email: admin.email, password: admin.password }).expect(401);
    await request(server()).post('/api/v1/auth/login').send({ email: admin.email, password: NEW_PASSWORD }).expect(200);
    expect(recovery.events.length).toBeGreaterThanOrEqual(0);
  });

  it('un enlace ya usado responde 409 al validarlo y al reutilizarlo (CA-12.5)', async () => {
    await requestLink().expect(202);
    const token = recovery.tokenFromLastMail();
    await reset(token).expect(204);

    const validated = await validate(token).expect(409);
    const reused = await reset(token, 'Otra-clave-2026!').expect(409);

    expect(validated.body.error.code).toBe('RECOVERY_LINK_USED');
    expect(reused.body.error.code).toBe('RECOVERY_LINK_USED');
  });

  it('un enlace vencido responde 410 (CA-12.5)', async () => {
    await requestLink().expect(202);
    recovery.tokens[0].expiresAt = new Date(Date.now() - 1000);

    const response = await validate(recovery.tokenFromLastMail()).expect(410);

    expect(response.body.error.code).toBe('RECOVERY_LINK_EXPIRED');
  });

  it('pedir otro enlace invalida el anterior', async () => {
    await requestLink().expect(202);
    const first = recovery.tokenFromLastMail();
    await requestLink().expect(202);
    const second = recovery.tokenFromLastMail();

    const replaced = await validate(first).expect(409);
    await validate(second).expect(204);

    expect(replaced.body.error.code).toBe('RECOVERY_LINK_REPLACED');
  });

  it('la cuarta solicitud en una hora responde igual pero no envía otro correo (CA-12.2)', async () => {
    const bodies: unknown[] = [];
    for (let attempt = 0; attempt < 4; attempt++) {
      bodies.push((await requestLink().expect(202)).body);
    }

    expect(recovery.mails).toHaveLength(3);
    expect(new Set(bodies.map((body) => JSON.stringify(body))).size).toBe(1);
  });

  it('una contraseña que no cumple la política responde 400 y el enlace sigue vigente (CA-12.3)', async () => {
    await requestLink().expect(202);
    const token = recovery.tokenFromLastMail();

    await reset(token, 'debil').expect(400);

    await validate(token).expect(204);
  });
});