import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { RATE_LIMITER, type RateLimiter } from '../../../auth/application/ports/rate-limiter.port';
import { AccessError } from '../../../../shared/security/errors/access-error';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';

@Injectable()
export class ChatRateLimitGuard implements CanActivate {
  constructor(@Inject(RATE_LIMITER) private readonly limiter: RateLimiter) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const actor = request.auth?.actor;
    if (!actor) {
      throw new AccessError('UNAUTHENTICATED');
    }
    const isRequest =
      request.method === 'POST' && request.url.split('?')[0].endsWith('/chat/conversations');
    const result = await this.limiter.consume(
      `chat:${isRequest ? 'requests' : 'writes'}:${actor.id}`,
      60_000,
      isRequest ? 10 : 60,
    );
    if (!result.allowed) {
      throw new AccessError('RATE_LIMITED', result.retryAfterSeconds);
    }
    return true;
  }
}
