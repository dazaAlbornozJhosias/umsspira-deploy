import { AppError } from '../../errors/app-error';

export type AccessErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'SESSION_REUSED'
  | 'RATE_LIMITED'
  | 'SESSION_NOT_FOUND'
  | 'PASSWORD_CONFLICT';

const MESSAGES: Record<AccessErrorCode, string> = {
  INVALID_CREDENTIALS: 'Correo electrónico o contraseña incorrectos',
  UNAUTHENTICATED: 'Debes iniciar sesión para continuar',
  FORBIDDEN: 'No tienes permiso para realizar esta operación',
  SESSION_REUSED: 'La sesión dejó de ser válida. Inicia sesión nuevamente',
  RATE_LIMITED: 'Demasiados intentos. Inténtalo nuevamente más tarde',
  SESSION_NOT_FOUND: 'No se encontró la sesión solicitada',
  PASSWORD_CONFLICT: 'La contraseña cambió durante la operación. Inicia sesión nuevamente',
};

export class AccessError extends AppError {
  constructor(
    code: AccessErrorCode,
    public readonly retryAfter?: number,
  ) {
    super(code, MESSAGES[code]);
  }
}
