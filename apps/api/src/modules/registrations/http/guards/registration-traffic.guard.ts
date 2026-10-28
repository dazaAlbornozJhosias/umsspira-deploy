import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { RATE_LIMITER, type RateLimiter } from '../../../auth/application/ports/rate-limiter.port';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import {
  REGISTRATION_SECURITY,
  type RegistrationSecurity,
} from '../../application/ports/registration-security.port';

@Injectable()
export class RegistrationTrafficGuard implements CanActivate {
  constructor(
    @Inject(RATE_LIMITER) private readonly limiter: RateLimiter,
    @Inject(REGISTRATION_SECURITY) private readonly security: RegistrationSecurity,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.security.hash(
      'registration-rate',
      (request.ip ?? 'unknown') + ':' + context.getClass().name,
    );
    const limit = await this.limiter.consume(key, 900000, 30);
    if (!limit.allowed) {
      throw new BusinessRuleError(
        'limited',
        'RATE_LIMITED',
        'Demasiadas solicitudes; intenta más tarde',
      );
    }
    return true;
  }
}
