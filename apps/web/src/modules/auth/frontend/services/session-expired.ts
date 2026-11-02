import { SessionError } from '@/shared/services/auth-session';

/**
 * HU-004 CA-06: aviso de sesión caducada en el portal administrativo.
 * Cualquier petición de reportería que reciba HTTP 401 emite este evento
 * y la ventana de alerta del layout de /reports lo atiende.
 */
export const SESSION_EXPIRED_EVENT = 'umsspira:sesion-expirada';
export const SESSION_EXPIRED_LOGIN_PATH = '/login?reportes=sesion-expirada';

export function notifySessionExpired(): void {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function isSessionExpiredError(error: unknown): boolean {
  return error instanceof SessionError && error.status === 401;
}
