import { MIN_HASH_SECRET_LENGTH } from './email-verification.constants';

// Token de inyeccion unico para NestJS
export const EMAIL_VERIFICATION_CONFIG = Symbol('EMAIL_VERIFICATION_CONFIG');

export type EmailVerificationConfig = {
  hashSecret: string;
};

/**
 * Lee y valida la configuracion al arrancar la aplicacion.
 * Si falta el secreto o es inferior a 32 caracteres, lanza un error claro que detiene el inicio.
 */
export function readEmailVerificationConfig(
  env: NodeJS.ProcessEnv = process.env,
): EmailVerificationConfig {
  const hashSecret = env.OTP_HASH_SECRET;
  if (!hashSecret || hashSecret.length < MIN_HASH_SECRET_LENGTH) {
    throw new Error(
      `OTP_HASH_SECRET es obligatoria y debe tener al menos ${MIN_HASH_SECRET_LENGTH} caracteres`,
    );
  }
  return { hashSecret };
}
