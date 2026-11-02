export const RECOVERY_LINK_MINUTES = 60;
export const RECOVERY_WINDOW_MS = 60 * 60 * 1000;
// Máximo de solicitudes por hora, por correo y por origen (CA-12.2).
export const RECOVERY_EMAIL_LIMIT = 3;
export const RECOVERY_ORIGIN_LIMIT = 3;

// Mensaje único: no revela si la cuenta existe, está activa o superó el límite (CA-12.2).
export const RECOVERY_GENERIC_MESSAGE =
  'Si el correo corresponde a una cuenta activa, te enviaremos un enlace para restablecer tu contraseña.';

export interface RecoveryLink {
  expiresAt: Date;
  usedAt: Date | null;
  revoked: boolean;
}

export type RecoveryLinkState = 'valid' | 'expired' | 'used' | 'revoked';

// Estado de un enlace en un instante dado (CA-12.3 y CA-12.5).
export function recoveryLinkState(link: RecoveryLink, now: Date): RecoveryLinkState {
  if (link.usedAt) {
    return 'used';
  }
  if (link.revoked) {
    return 'revoked';
  }
  if (link.expiresAt.getTime() <= now.getTime()) {
    return 'expired';
  }
  return 'valid';
}

export function recoveryExpiry(now: Date): Date {
  return new Date(now.getTime() + RECOVERY_LINK_MINUTES * 60_000);
}