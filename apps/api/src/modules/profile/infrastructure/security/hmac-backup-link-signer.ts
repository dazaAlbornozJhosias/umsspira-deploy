import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Environment } from '../../../../config/environment';
import type { BackupLinkSigner } from '../../application/ports/backup-link-signer.port';

@Injectable()
export class HmacBackupLinkSigner implements BackupLinkSigner {
  private readonly secret: string;

  constructor(config: ConfigService<Environment, true>) {
    this.secret = config.get('AUTH_JWT_SECRET', { infer: true });
  }

  sign(certificationId: string, expiresAt: number): string {
    return createHmac('sha256', this.secret)
      .update('certification-backup:')
      .update(certificationId)
      .update(':')
      .update(String(expiresAt))
      .digest('base64url');
  }

  verify(certificationId: string, expiresAt: number, signature: string): boolean {
    const expected = Buffer.from(this.sign(certificationId, expiresAt));
    const received = Buffer.from(signature);
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}
