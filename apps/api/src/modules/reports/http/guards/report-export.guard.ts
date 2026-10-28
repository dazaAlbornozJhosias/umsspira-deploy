import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { RATE_LIMITER, type RateLimiter } from '../../../auth/application/ports/rate-limiter.port';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';
import { AccessError } from '../../../../shared/security/errors/access-error';

@Injectable()
export class ReportExportGuard implements CanActivate {
  constructor(@Inject(RATE_LIMITER) private readonly limiter: RateLimiter) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const actor = context.switchToHttp().getRequest<AuthRequest>().auth?.actor;
    if (!actor) {
      throw new AccessError('UNAUTHENTICATED');
    }
    const result = await this.limiter.consume('report-export:' + actor.id, 60000, 5);
    if (!result.allowed) {
      throw new AccessError('RATE_LIMITED', result.retryAfterSeconds);
    }
    return true;
  }
}
