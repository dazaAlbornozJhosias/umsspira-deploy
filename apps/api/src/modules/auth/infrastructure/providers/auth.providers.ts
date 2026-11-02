import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../../config/environment';
import { USER_READER, type UserReader } from '../../../user/application/ports/user-reader.port';
import { AUTH_OPTIONS, type AuthOptions } from '../../application/contracts/auth-options';
import {
  CREDENTIAL_REPOSITORY,
  type CredentialRepository,
} from '../../application/ports/credential-repository.port';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../application/ports/session-repository.port';
import { PASSWORD_HASHER, type PasswordHasher } from '../../application/ports/password-hasher.port';
import { TOKEN_SERVICE, type TokenService } from '../../application/ports/token-service.port';
import { RATE_LIMITER, type RateLimiter } from '../../application/ports/rate-limiter.port';
import { PrismaCredentialRepository } from '../repositories/prisma-credential.repository';
import { PrismaSessionRepository } from '../repositories/prisma-session.repository';
import { Argon2PasswordHasher } from '../security/argon2-password.hasher';
import { JwtTokenService } from '../security/jwt-token.service';
import { RedisRateLimiter } from '../security/redis-rate-limiter';
import { InMemoryRateLimiter } from '../security/in-memory-rate-limiter';
import { SessionIssuer } from '../../application/services/session-issuer.service';
import { SessionReader } from '../../application/services/session-reader.service';
import { AccessLimiter } from '../../application/services/access-limiter.service';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { AuthenticateUseCase } from '../../application/use-cases/authenticate.use-case';
import { InspectSessionUseCase } from '../../application/use-cases/inspect-session.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { LogoutAllUseCase } from '../../application/use-cases/logout-all.use-case';
import { ListSessionsUseCase } from '../../application/use-cases/list-sessions.use-case';
import { RevokeSessionUseCase } from '../../application/use-cases/revoke-session.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import {
  PASSWORD_RECOVERY_OPTIONS,
  type PasswordRecoveryOptions,
} from '../../application/contracts/password-recovery-options';
import {
  PASSWORD_RECOVERY_REPOSITORY,
  type PasswordRecoveryRepository,
} from '../../application/ports/password-recovery-repository.port';
import { RequestPasswordRecoveryUseCase } from '../../application/use-cases/request-password-recovery.use-case';
import { ValidatePasswordRecoveryLinkUseCase } from '../../application/use-cases/validate-password-recovery-link.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { PrismaPasswordRecoveryRepository } from '../repositories/prisma-password-recovery.repository';

export const authProviders: Provider[] = [
  PrismaCredentialRepository,
  PrismaSessionRepository,
  RedisRateLimiter,
  { provide: CREDENTIAL_REPOSITORY, useExisting: PrismaCredentialRepository },
  { provide: SESSION_REPOSITORY, useExisting: PrismaSessionRepository },
  {
    provide: RATE_LIMITER,
    inject: [ConfigService, RedisRateLimiter],
    useFactory: (config: ConfigService<Environment, true>, redis: RedisRateLimiter): RateLimiter =>
      config.get('AUTH_RATE_LIMIT_STORE', { infer: true }) === 'memory'
        ? new InMemoryRateLimiter()
        : redis,
  },
  { provide: PASSWORD_HASHER, useFactory: () => new Argon2PasswordHasher() },
  {
    provide: TOKEN_SERVICE,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Environment, true>) =>
      new JwtTokenService({
        secret: config.get('AUTH_JWT_SECRET', { infer: true }),
        issuer: config.get('AUTH_JWT_ISSUER', { infer: true }),
        audience: config.get('AUTH_JWT_AUDIENCE', { infer: true }),
        accessSeconds: config.get('AUTH_ACCESS_SECONDS', { infer: true }),
      }),
  },
  {
    provide: AUTH_OPTIONS,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Environment, true>): AuthOptions => ({
      accessSeconds: config.get('AUTH_ACCESS_SECONDS', { infer: true }),
      sessionHours: config.get('AUTH_SESSION_HOURS', { infer: true }),
      rememberDays: config.get('AUTH_REMEMBER_DAYS', { infer: true }),
    }),
  },
  {
    provide: SessionIssuer,
    inject: [TOKEN_SERVICE, AUTH_OPTIONS],
    useFactory: (tokens: TokenService, options: AuthOptions) => new SessionIssuer(tokens, options),
  },
  {
    provide: SessionReader,
    inject: [SESSION_REPOSITORY, USER_READER, TOKEN_SERVICE],
    useFactory: (sessions: SessionRepository, users: UserReader, tokens: TokenService) =>
      new SessionReader(sessions, users, tokens),
  },
  {
    provide: AccessLimiter,
    inject: [RATE_LIMITER, TOKEN_SERVICE],
    useFactory: (limiter: RateLimiter, tokens: TokenService) => new AccessLimiter(limiter, tokens),
  },
  {
    provide: LoginUseCase,
    inject: [
      CREDENTIAL_REPOSITORY,
      SESSION_REPOSITORY,
      USER_READER,
      PASSWORD_HASHER,
      TOKEN_SERVICE,
      AUTH_OPTIONS,
      SessionIssuer,
      AccessLimiter,
    ],
    useFactory: (
      credentials: CredentialRepository,
      sessions: SessionRepository,
      users: UserReader,
      passwords: PasswordHasher,
      tokens: TokenService,
      options: AuthOptions,
      issuer: SessionIssuer,
      limiter: AccessLimiter,
    ) =>
      new LoginUseCase(credentials, sessions, users, passwords, tokens, options, issuer, limiter),
  },
  {
    provide: RefreshSessionUseCase,
    inject: [SESSION_REPOSITORY, TOKEN_SERVICE, SessionIssuer, SessionReader, AccessLimiter],
    useFactory: (
      sessions: SessionRepository,
      tokens: TokenService,
      issuer: SessionIssuer,
      reader: SessionReader,
      limiter: AccessLimiter,
    ) => new RefreshSessionUseCase(sessions, tokens, issuer, reader, limiter),
  },
  {
    provide: AuthenticateUseCase,
    inject: [SESSION_REPOSITORY, TOKEN_SERVICE, SessionReader],
    useFactory: (sessions: SessionRepository, tokens: TokenService, reader: SessionReader) =>
      new AuthenticateUseCase(sessions, tokens, reader),
  },
  {
    provide: InspectSessionUseCase,
    inject: [SessionReader],
    useFactory: (reader: SessionReader) => new InspectSessionUseCase(reader),
  },
  {
    provide: LogoutUseCase,
    inject: [SESSION_REPOSITORY],
    useFactory: (sessions: SessionRepository) => new LogoutUseCase(sessions),
  },
  {
    provide: LogoutAllUseCase,
    inject: [SESSION_REPOSITORY],
    useFactory: (sessions: SessionRepository) => new LogoutAllUseCase(sessions),
  },
  {
    provide: ListSessionsUseCase,
    inject: [SESSION_REPOSITORY],
    useFactory: (sessions: SessionRepository) => new ListSessionsUseCase(sessions),
  },
  {
    provide: RevokeSessionUseCase,
    inject: [SESSION_REPOSITORY],
    useFactory: (sessions: SessionRepository) => new RevokeSessionUseCase(sessions),
  },
  {
    provide: ChangePasswordUseCase,
    inject: [CREDENTIAL_REPOSITORY, PASSWORD_HASHER, AccessLimiter],
    useFactory: (
      credentials: CredentialRepository,
      passwords: PasswordHasher,
      limiter: AccessLimiter,
    ) => new ChangePasswordUseCase(credentials, passwords, limiter),
  },
  
    PrismaPasswordRecoveryRepository,
  { provide: PASSWORD_RECOVERY_REPOSITORY, useExisting: PrismaPasswordRecoveryRepository },
  {
    provide: PASSWORD_RECOVERY_OPTIONS,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Environment, true>): PasswordRecoveryOptions => ({
      // Sin barra final, para que el enlace quede {WEB_BASE_URL}/reset-password.
      webBaseUrl: config.get('WEB_BASE_URL', { infer: true }).replace(/\/+$/, ''),
    }),
  },
  {
    provide: RequestPasswordRecoveryUseCase,
    inject: [
      CREDENTIAL_REPOSITORY,
      USER_READER,
      PASSWORD_RECOVERY_REPOSITORY,
      TOKEN_SERVICE,
      PASSWORD_RECOVERY_OPTIONS,
    ],
    useFactory: (
      credentials: CredentialRepository,
      users: UserReader,
      repository: PasswordRecoveryRepository,
      tokens: TokenService,
      options: PasswordRecoveryOptions,
    ) => new RequestPasswordRecoveryUseCase(credentials, users, repository, tokens, options),
  },
  {
    provide: ValidatePasswordRecoveryLinkUseCase,
    inject: [PASSWORD_RECOVERY_REPOSITORY, TOKEN_SERVICE],
    useFactory: (repository: PasswordRecoveryRepository, tokens: TokenService) =>
      new ValidatePasswordRecoveryLinkUseCase(repository, tokens),
  },
  {
    provide: ResetPasswordUseCase,
    inject: [PASSWORD_RECOVERY_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
    useFactory: (
      repository: PasswordRecoveryRepository,
      passwords: PasswordHasher,
      tokens: TokenService,
    ) => new ResetPasswordUseCase(repository, passwords, tokens),
  },
];
