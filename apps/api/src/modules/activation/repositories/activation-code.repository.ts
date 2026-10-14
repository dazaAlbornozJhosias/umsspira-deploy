// apps/api/src/modules/activation/repositories/activation-code.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { ACTIVATION_REDIS } from '../activation.constants';

@Injectable()
export class ActivationCodeRepository {
  constructor(@Inject(ACTIVATION_REDIS) private readonly redis: Redis) {}

  /**
   * Reemplaza cualquier código anterior de la solicitud en una sola transacción.
   * Guarda el hash, el contador de intentos y la vigencia.
   */
  async save(requestId: string, codeHash: string, ttlSeconds: number): Promise<void> {
    const key = this.keyFor(requestId);
    const results = await this.redis
      .multi()
      .del(key)
      .hset(key, { codeHash, attempts: 0 })
      .expire(key, ttlSeconds)
      .exec();

    if (!results || results.some(([error]) => error)) {
      throw new Error('No se pudo guardar el código de activación en Redis');
    }
  }

  private keyFor(requestId: string): string {
    return `activation:${requestId}`;
  }
}