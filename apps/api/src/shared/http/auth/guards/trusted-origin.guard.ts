import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Environment } from '../../../../config/environment';
import { AccessError } from '../../../security/errors/access-error';

@Injectable()
export class TrustedOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin;
    const allowed = this.config.get('CORS_ORIGINS', { infer: true });
    if (
      (origin && !allowed.includes(origin)) ||
      (!origin && request.headers['sec-fetch-site'] === 'cross-site')
    ) {
      throw new AccessError('FORBIDDEN');
    }
    return true;
  }
}
