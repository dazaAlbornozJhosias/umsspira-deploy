import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { AUTHENTICATOR, type Authenticator } from '../../../security/ports/authenticator.port';
import { AccessError } from '../../../security/errors/access-error';
import { ACCESS_COOKIE, readCookie } from '../cookies/request-cookies';
import type { AuthRequest } from '../contracts/auth-request';

@Injectable()
export class OptionalAuthenticationGuard implements CanActivate {
  constructor(@Inject(AUTHENTICATOR) private readonly authenticator: Authenticator) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authorization = request.headers.authorization;
    const bearer = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
    if (authorization && !bearer) {
      throw new AccessError('UNAUTHENTICATED');
    }
    const token = bearer ?? readCookie(request, ACCESS_COOKIE);
    if (token) {
      try {
        request.auth = await this.authenticator.execute(token);
      } catch (error) {
        // Una credencial vencida no impide leer recursos públicos como visitante.
        // Las fallas de infraestructura se propagan; la propiedad se comprueba en el caso de lectura.
        if (!(error instanceof AccessError)) {
          throw error;
        }
      }
    }
    return true;
  }
}
