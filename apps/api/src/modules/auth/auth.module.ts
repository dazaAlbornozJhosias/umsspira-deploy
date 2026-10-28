import { AUTHENTICATOR } from '../../shared/security/ports/authenticator.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { RATE_LIMITER } from './application/ports/rate-limiter.port';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { RedisModule } from '../../shared/infrastructure/redis/redis.module';
import { AuthenticationGuard } from '../../shared/http/auth/guards/authentication.guard';
import { PermissionsGuard } from '../../shared/http/auth/guards/permissions.guard';
import { TrustedOriginGuard } from '../../shared/http/auth/guards/trusted-origin.guard';
import { UserModule } from '../user/user.module';
import { AuthenticateUseCase } from './application/use-cases/authenticate.use-case';
import { authProviders } from './infrastructure/providers/auth.providers';
import { SessionCookies } from './http/cookies/session.cookies';
import { LoginController } from './http/controllers/login.controller';
import { RefreshSessionController } from './http/controllers/refresh-session.controller';
import { GetAuthenticatedUserController } from './http/controllers/get-authenticated-user.controller';
import { InspectSessionController } from './http/controllers/inspect-session.controller';
import { LogoutController } from './http/controllers/logout.controller';
import { LogoutAllController } from './http/controllers/logout-all.controller';
import { ListSessionsController } from './http/controllers/list-sessions.controller';
import { RevokeSessionController } from './http/controllers/revoke-session.controller';
import { ChangePasswordController } from './http/controllers/change-password.controller';

@Module({
  imports: [PrismaModule, RedisModule, UserModule],
  controllers: [
    LoginController,
    RefreshSessionController,
    GetAuthenticatedUserController,
    InspectSessionController,
    LogoutController,
    LogoutAllController,
    ListSessionsController,
    RevokeSessionController,
    ChangePasswordController,
  ],
  providers: [
    ...authProviders,
    SessionCookies,
    { provide: AUTHENTICATOR, useExisting: AuthenticateUseCase },
    TrustedOriginGuard,
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthenticateUseCase, PASSWORD_HASHER, RATE_LIMITER, AUTHENTICATOR],
})
export class AuthModule {}
