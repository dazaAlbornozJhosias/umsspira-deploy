import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { CorrectionTokenService } from '../../application/services/correction-token.service';

export interface CorrectionRequest extends Request {
  applicationId?: string;
  correctionToken?: string;
}

@Injectable()
export class CorrectionTokenGuard implements CanActivate {
  constructor(private readonly tokenService: CorrectionTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CorrectionRequest>();
    const headerValue = request.headers['x-correction-token'];

    const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!token || typeof token !== 'string' || !token.trim()) {
      throw new BusinessRuleError(
        'missing',
        'TOKEN_NOT_FOUND',
        'El recurso solicitado no existe o no está disponible',
      );
    }

    const applicationId = await this.tokenService.resolve(token.trim());
    request.applicationId = applicationId;
    request.correctionToken = token.trim();

    return true;
  }
}
