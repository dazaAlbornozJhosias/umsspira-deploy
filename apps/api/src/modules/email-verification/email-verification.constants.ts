// Reglas de negocio de la HU-02. Un solo lugar para cambiarlas.
export const CODE_LENGTH = 6;
export const CODE_TTL_SECONDS = 5 * 60; // 5 minutos de vigencia
export const RESEND_COOLDOWN_SECONDS = 30; // 30 segundos de espera entre reenvios
export const MAX_VERIFY_ATTEMPTS = 5; // Maximo 5 intentos fallidos antes de invalidar
export const MIN_HASH_SECRET_LENGTH = 32;

// Prefijo de las claves de Redis de este modulo
export const REDIS_KEY_PREFIX = 'email-verification';

export const EMAIL_VERIFICATION_MESSAGES = {
  draftNotFound:
    'El tiempo para completar tu registro venció. Debes llenar el formulario desde el inicio',
  codeIncorrect: 'El código ingresado no es correcto. Intenta nuevamente',
  codeExpired: 'El código expiró. Solicita uno nuevo',
  attemptsExceeded:
    'Superaste el número de intentos permitidos. Solicita un código nuevo',
  alreadyVerified: 'Tu correo ya fue verificado',
} as const;

export function buildCooldownMessage(seconds: number): string {
  return `Espera ${seconds} segundos para solicitar un nuevo código`;
}