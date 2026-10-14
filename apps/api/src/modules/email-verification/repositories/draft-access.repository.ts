import { Injectable } from '@nestjs/common';
import { redisClient as redis } from '@/shared/lib/redis';

// Prefijo de clave alineado con el modulo de registro de Mauricio (HU-01)
const DRAFT_KEY_PREFIX = 'registration-session';

export type RegistrationDraft = {
  email: string;
  emailVerified: boolean;
};

const buildDraftKey = (registrationId: string) =>
  `${DRAFT_KEY_PREFIX}:${registrationId}`;

@Injectable()
export class DraftAccessRepository {
  /** Devuelve el borrador de registro o null si no existe o expiro (2 horas). */
  async find(registrationId: string): Promise<RegistrationDraft | null> {
    const raw = await redis.get(buildDraftKey(registrationId));
    if (!raw) {
      return null;
    }
    const record = this.parse(raw);
    const email = (record.correo ?? record.email) as string;
    const isVerified = (record.isEmailVerified ?? record.emailVerified) === true;

    return {
      email,
      emailVerified: isVerified,
    };
  }

  /** Marca el correo como verificado conservando el tiempo de vida (TTL) del borrador en Redis. */
  async markEmailVerified(registrationId: string): Promise<void> {
    const key = buildDraftKey(registrationId);
    const raw = await redis.get(key);
    if (!raw) {
      return;
    }
    const parsed = this.parse(raw);
    const updated = {
      ...parsed,
      isEmailVerified: true,
      emailVerified: true,
    };
    // KEEPTTL asegura que las 2 horas de vigencia de la sesion en Redis no se reinicien
    await redis.set(key, JSON.stringify(updated), 'KEEPTTL');
  }

  private parse(raw: string): Record<string, unknown> {
    const record = JSON.parse(raw) as Record<string, unknown>;
    const email = record.correo ?? record.email;
    if (typeof email !== 'string') {
      throw new Error('El borrador de registro no tiene el formato esperado (falta correo)');
    }
    return record;
  }
}