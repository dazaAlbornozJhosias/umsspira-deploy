import type { RecoveryTokenRecord } from '../../domain/entities/password-recovery.entity';

export const PASSWORD_RECOVERY_REPOSITORY = Symbol('PASSWORD_RECOVERY_REPOSITORY');

export type RecoveryRequestResult =
  | 'solicitado'
  | 'rechazado_rate'
  | 'rechazado_inactivo'
  | 'rechazado_no_existe';

export type RecoveryEventType =
  | 'solicitud'
  | 'enlace_enviado'
  | 'enlace_abierto'
  | 'password_cambiada'
  | 'enlace_vencido'
  | 'enlace_reutilizado'
  | 'enlace_revocado'
  | 'error_smtp';

export interface RecoveryEvent {
  type: RecoveryEventType;
  userId: string | null;
  email: string | null;
  at: Date;
}

export interface RecoveryIssue {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  subject: string;
  body: string;
  now: Date;
}

export type RecoveryResetOutcome =
  | { status: 'reset'; userId: string }
  | { status: 'expired' | 'used' | 'revoked'; userId: string }
  | { status: 'invalid' };

export interface PasswordRecoveryRepository {
  // Solicitudes de la última ventana que no fueron rechazadas por límite.
  countRecentRequests(
    email: string,
    originHash: string,
    since: Date,
  ): Promise<{ byEmail: number; byOrigin: number }>;
  recordRequest(input: {
    email: string;
    originHash: string;
    userId: string | null;
    result: RecoveryRequestResult;
    at: Date;
  }): Promise<void>;
  // Revoca el enlace activo, crea el nuevo y encola el correo en una sola transacción.
  // Devuelve false si otra solicitud simultánea ya creó el enlace activo.
  issue(input: RecoveryIssue): Promise<boolean>;
  findByHash(tokenHash: string): Promise<RecoveryTokenRecord | null>;
  // Consume el enlace, cambia la contraseña y cierra todas las sesiones en una sola transacción.
  reset(input: { tokenHash: string; passwordHash: string; now: Date }): Promise<RecoveryResetOutcome>;
  recordEvent(event: RecoveryEvent): Promise<void>;
}