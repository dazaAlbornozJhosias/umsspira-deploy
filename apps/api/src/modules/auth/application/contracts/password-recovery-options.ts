export const PASSWORD_RECOVERY_OPTIONS = Symbol('PASSWORD_RECOVERY_OPTIONS');

export interface PasswordRecoveryOptions {
  // Dirección pública del frontend, sin barra final. El enlace del correo apunta a /reset-password.
  webBaseUrl: string;
}