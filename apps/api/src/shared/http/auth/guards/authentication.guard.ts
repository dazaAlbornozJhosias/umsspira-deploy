import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTHENTICATOR, type Authenticator } from '../../../security/ports/authenticator.port';
import { AccessError } from '../../../security/errors/access-error';
import { PUBLIC_ROUTE } from '../decorators/public.decorator';
import { ACCESS_COOKIE, csrfHeader, readCookie } from '../cookies/request-cookies';
import type { AuthRequest } from '../contracts/auth-request';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTHENTICATOR) private readonly auth: Authenticator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authorization = request.headers.authorization;
    const bearer = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if (authorization && !bearer) {
      throw new AccessError('UNAUTHENTICATED');
    }
    const token = bearer ?? readCookie(request, ACCESS_COOKIE);
    if (!token) {
      throw new AccessError('UNAUTHENTICATED');
    }
    const mutates = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    request.auth = await this.auth.execute(
      token,
      !bearer && mutates ? csrfHeader(request) : undefined,
    );
    return true;
  }
}
