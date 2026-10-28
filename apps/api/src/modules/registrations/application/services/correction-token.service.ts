import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../../config/environment';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import {
  CORRECTION_TOKEN_PORT,
  type CorrectionTokenPort,
} from '../ports/correction-token.port';
import {
  CORRECTION_LINK_DEFAULT_TTL_DAYS,
  CORRECTION_TOKEN_BYTES,
  CORRECTION_URL_PATH,
} from '../../domain/policies/correction.policy';

@Injectable()
export class CorrectionTokenService {
  private readonly logger = new Logger(CorrectionTokenService.name);
  private readonly webBaseUrl: string;
  private readonly ttlDays: number;

  constructor(
    @Inject(CORRECTION_TOKEN_PORT) private readonly port: CorrectionTokenPort,
    config: ConfigService<Environment, true>,
  ) {
    this.webBaseUrl = config.get('WEB_BASE_URL', { infer: true }) ?? 'http://localhost:3001';
    this.ttlDays =
      config.get('CORRECTION_LINK_TTL_DAYS', { infer: true }) ?? CORRECTION_LINK_DEFAULT_TTL_DAYS;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issueLink(applicationId: string): Promise<string> {
    const rawToken = randomBytes(CORRECTION_TOKEN_BYTES).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.ttlDays * 86400 * 1000);

    await this.port.saveToken(applicationId, tokenHash, expiresAt);
    const baseUrl = this.webBaseUrl.replace(/\/$/, '');
    return `${baseUrl}${CORRECTION_URL_PATH}/${rawToken}`;
  }

  async resolve(token: string): Promise<string> {
    if (!token || typeof token !== 'string') {
      this.logger.warn('Intento de resolucion con formato de token vacio o invalido');
      throw new BusinessRuleError(
        'missing',
        'TOKEN_NOT_FOUND',
        'El recurso solicitado no existe o no está disponible',
      );
    }

    const tokenHash = this.hashToken(token);
    const stored = await this.port.findActiveToken(tokenHash);

    if (!stored || stored.revoked || stored.used || stored.expiresAt.getTime() <= Date.now()) {
      this.logger.warn('Token de subsanacion inexistente, revocado o expirado');
      throw new BusinessRuleError(
        'missing',
        'TOKEN_NOT_FOUND',
        'El recurso solicitado no existe o no está disponible',
      );
    }

    const status = await this.port.getApplicationStatus(stored.applicationId);
    if (status !== 'OBSERVED' && status !== 'OBSERVADA') {
      this.logger.warn('La solicitud asociada ya no se encuentra en estado observada');
      throw new BusinessRuleError(
        'missing',
        'TOKEN_NOT_FOUND',
        'El recurso solicitado no existe o no está disponible',
      );
    }

    return stored.applicationId;
  }

  async revoke(applicationId: string): Promise<void> {
    await this.port.revokeByApplication(applicationId);
  }
}
