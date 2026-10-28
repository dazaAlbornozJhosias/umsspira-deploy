export interface ActivationStatus {
  maskedEmail: string;
  expiresAt: string | null;
  cooldownSeconds: number;
  resendCount: number;
  failedAttempts: number;
}

export class ActivationError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number) { super(message); }
}

export interface VerifyActivationOtpResponse {
  activationToken: string;
  expiresInSeconds?: number;
}

export interface ResendActivationOtpResponse {
  message?: string;
  cooldownSeconds?: number;
  resendCount?: number;
  expiresAt?: string;
}

export interface ActivateAccountPayload {
  applicationId: string;
  activationToken: string;
  password: string;
}

export interface ActivateAccountResponse {
  activated: boolean;
  message?: string;
}

export class ActivationService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async inspect(applicationId: string): Promise<ActivationStatus> {
    const response = await fetch(`${this.baseUrl}/api/v1/registrations/activate/status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId }), cache: 'no-store',
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.data) {
      throw new ActivationError(body?.error?.message ?? 'No se pudo consultar la activación', body?.error?.code ?? 'ACTIVATION_REQUEST_FAILED', response.status);
    }
    return body.data;
  }

  async verifyOtp(applicationId: string, code: string): Promise<VerifyActivationOtpResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/registrations/activate/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, code }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.error?.message ||
        (response.status === 410
          ? 'El código de activación venció'
          : response.status === 429
            ? 'Se agotaron los intentos de activación'
            : 'Código incorrecto');
      throw new ActivationError(errorMsg, data?.error?.code ?? 'ACTIVATION_REQUEST_FAILED', response.status);
    }

    return (data?.data ?? data) as VerifyActivationOtpResponse;
  }

  async resendOtp(applicationId: string): Promise<ResendActivationOtpResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/registrations/activate/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.error?.message || 'No fue posible reenviar el código';
      throw new ActivationError(errorMsg, data?.error?.code ?? 'ACTIVATION_REQUEST_FAILED', response.status);
    }

    return (data?.data ?? data) as ResendActivationOtpResponse;
  }

  async activateAccount(payload: ActivateAccountPayload): Promise<ActivateAccountResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/registrations/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.error?.message ||
        (response.status === 409
          ? 'Tu cuenta ya está activa. Inicia sesión o recupera tu contraseña'
          : response.status === 410
            ? 'El pase de activación ha vencido; valida el código otra vez'
            : response.status === 429
              ? 'Se agotaron los intentos de activación'
              : 'Error al activar la cuenta');
      throw new ActivationError(errorMsg, data?.error?.code ?? 'ACTIVATION_REQUEST_FAILED', response.status);
    }

    return (data?.data ?? data) as ActivateAccountResponse;
  }
}

export const activationService = new ActivationService();
