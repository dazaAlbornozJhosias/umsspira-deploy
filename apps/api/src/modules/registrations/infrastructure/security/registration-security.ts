import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
} from 'node:crypto';
import type { Environment } from '../../../../config/environment';
import type { RegistrationSecurity } from '../../application/ports/registration-security.port';

@Injectable()
export class NodeRegistrationSecurity implements RegistrationSecurity {
  private readonly secret: string;
  private readonly key: Buffer;

  constructor(config: ConfigService<Environment, true>) {
    this.secret = config.get('AUTH_JWT_SECRET', { infer: true });
    this.key = createHash('sha256').update('registration-mail:').update(this.secret).digest();
  }

  token(): string {
    return randomUUID();
  }

  code(): string {
    return String(randomInt(0, 1000000)).padStart(6, '0');
  }

  hash(purpose: string, value: string): string {
    return createHmac('sha256', this.secret)
      .update(purpose)
      .update(':')
      .update(value)
      .digest('hex');
  }

  seal(value: unknown): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const bytes = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString('base64url');
  }

  open(value: string): unknown {
    const bytes = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', this.key, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'),
    );
  }
}
