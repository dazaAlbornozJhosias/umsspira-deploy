import { Injectable } from '@nestjs/common';
import { redisClient as redis } from '@/shared/lib/redis';
import { REDIS_KEY_PREFIX } from '../email-verification.constants';

const buildCodeKey = (registrationId: string) =>
  `${REDIS_KEY_PREFIX}:code:${registrationId}`;
const buildCooldownKey = (registrationId: string) =>
  `${REDIS_KEY_PREFIX}:cooldown:${registrationId}`;

// Devuelve -1 si el código ya no existe (expirado o borrado); si existe, suma un intento y devuelve el total.
// Se ejecuta de forma atómica dentro del motor de Redis mediante Lua.
const INCREMENT_ATTEMPTS_SCRIPT = `
if redis.call('EXISTS', KEYS[1]) == 0 then
  return -1
end
return redis.call('HINCRBY', KEYS[1], 'attempts', 1)
`;
const CODE_MISSING = -1;

@Injectable()
export class EmailVerificationRepository {
  /** Reserva la espera de reenvío. Devuelve false si el cooldown todavía está vigente. */
  async reserveCooldown(
    registrationId: string,
    seconds: number,
  ): Promise<boolean> {
    const result = await redis.set(
      buildCooldownKey(registrationId),
      '1',
      'EX',
      seconds,
      'NX',
    );
    return result === 'OK';
  }

  async getCooldownRemaining(registrationId: string): Promise<number> {
    const remaining = await redis.ttl(buildCooldownKey(registrationId));
    return remaining > 0 ? remaining : 0;
  }

  /** Guarda el hash del código y reinicia los intentos. Reemplaza cualquier código anterior. */
  async storeCode(
    registrationId: string,
    hash: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = buildCodeKey(registrationId);
    await redis
      .multi()
      .hset(key, 'hash', hash, 'attempts', 0)
      .expire(key, ttlSeconds)
      .exec();
  }

  async findCodeHash(registrationId: string): Promise<string | null> {
    return redis.hget(buildCodeKey(registrationId), 'hash');
  }

  /** Suma un intento de forma atómica. Devuelve null si el código ya no existe. */
  async incrementAttempts(registrationId: string): Promise<number | null> {
    const result = (await redis.eval(
      INCREMENT_ATTEMPTS_SCRIPT,
      1,
      buildCodeKey(registrationId),
    )) as number;
    return result === CODE_MISSING ? null : result;
  }

  /** Invalida el código vigente (conserva la espera de reenvío). */
  async deleteCode(registrationId: string): Promise<void> {
    await redis.del(buildCodeKey(registrationId));
  }

  /** Borra todo el estado de verificación del registro (código y cooldown). */
  async deleteAll(registrationId: string): Promise<void> {
    await redis.del(
      buildCodeKey(registrationId),
      buildCooldownKey(registrationId),
    );
  }
}