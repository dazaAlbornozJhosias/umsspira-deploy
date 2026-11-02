import { ApiClientError, apiClient } from "@/shared/services/api-client";

// Solicita el enlace de recuperación de contraseña (CA-12.2).
// El backend responde siempre igual, exista o no la cuenta.
export async function requestPasswordRecovery(email: string): Promise<void> {
  await apiClient<unknown>("/api/v1/auth/password-recovery/request", {
    method: "POST",
    body: { email },
  });
}

export type RecoveryLinkFailure = "expired" | "used" | "replaced" | "invalid";

// Códigos que devuelve el backend cuando el enlace no sirve (CA-12.5).
const LINK_FAILURE_BY_CODE: Record<string, RecoveryLinkFailure> = {
  RECOVERY_LINK_EXPIRED: "expired",
  RECOVERY_LINK_USED: "used",
  RECOVERY_LINK_REPLACED: "replaced",
  RECOVERY_LINK_INVALID: "invalid",
};

export class RecoveryLinkError extends Error {
  constructor(
    public readonly reason: RecoveryLinkFailure,
    message: string,
  ) {
    super(message);
    this.name = "RecoveryLinkError";
  }
}

// Convierte los errores del enlace en RecoveryLinkError; el resto se propaga igual.
function toRecoveryError(error: unknown): unknown {
  if (error instanceof ApiClientError && error.code) {
    const reason = LINK_FAILURE_BY_CODE[error.code];
    if (reason) return new RecoveryLinkError(reason, error.message);
  }
  return error;
}

// Comprueba si el enlace sigue vigente al abrir la pantalla (CA-12.3 y CA-12.5).
export async function validateRecoveryLink(token: string): Promise<void> {
  try {
    await apiClient<void>("/api/v1/auth/password-recovery/validate", {
      method: "POST",
      body: { token },
    });
  } catch (error) {
    throw toRecoveryError(error);
  }
}

// Cambia la contraseña con el enlace; el backend cierra las sesiones (CA-12.4).
export async function resetPassword(token: string, password: string): Promise<void> {
  try {
    await apiClient<void>("/api/v1/auth/password-recovery/reset", {
      method: "POST",
      body: { token, password },
    });
  } catch (error) {
    throw toRecoveryError(error);
  }
}