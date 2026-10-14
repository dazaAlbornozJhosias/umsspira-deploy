// apps/api/src/modules/activation/services/activation-code.service.ts
import { Injectable } from '@nestjs/common';
import { createHmac, randomInt } from 'crypto';
import { ACTIVATION_CODE_LENGTH, ACTIVATION_CODE_TTL_SECONDS } from '../activation.constants';
import { ActivationCodeRepository } from '../repositories/activation-code.repository';

@Injectable()
export class ActivationCodeService {
  constructor(private readonly repo: ActivationCodeRepository) {}

  /**
   * Genera un código nuevo para la solicitud aprobada y reemplaza el anterior.
   * Devuelve el código en claro solo para enviarlo por correo: no se guarda ni se registra.
   */
  async issue(requestId: string): Promise<string> {
    const secret = this.readSecret();
    const code = this.generateCode();
    await this.repo.save(
      requestId,
      this.hash(secret, requestId, code),
      ACTIVATION_CODE_TTL_SECONDS,
    );
    return code;
  }

  private generateCode(): string {
    return String(randomInt(0, 10 ** ACTIVATION_CODE_LENGTH)).padStart(
      ACTIVATION_CODE_LENGTH,
      '0',
    );
  }

  private hash(secret: string, requestId: string, code: string): string {
    return createHmac('sha256', secret).update(`${requestId}:${code}`).digest('hex');
  }

  private readSecret(): string {
    const secret = process.env.ACTIVATION_CODE_SECRET;
    if (!secret) {
      throw new Error('Falta la variable de entorno ACTIVATION_CODE_SECRET');
    }
    return secret;
  }
}