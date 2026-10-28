import { readApiError } from '@/shared/services/api-contract';

export interface VerifyOtpPayload {
  email: string;
  code: string;
  sessionToken?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  isExpired?: boolean;
  maxAttemptsExceeded?: boolean;
}

export interface ResendOtpPayload {
  email: string;
  sessionToken?: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  maskedEmail?: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
}

export class EmailVerificationService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Envía el código OTP de 6 dígitos ingresado por el titulado para su validación.
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    try {
      if (!payload.sessionToken) {
        return { success: false, error: 'La sesión de registro venció. Inicia el registro nuevamente' };
      }

      const response = await fetch(`${this.baseUrl}/api/v1/email-verification/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: payload.sessionToken,
          email: payload.email,
          code: payload.code,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = readApiError(data, 'El código ingresado no es correcto. Intenta nuevamente');
        const errorMsg = detail.message;
        if (response.status === 410 || detail.code === 'CODE_EXPIRED') {
          return {
            success: false,
            isExpired: true,
            error: errorMsg || 'El código expiró. Solicita uno nuevo',
          };
        }

        if (response.status === 429 || detail.code === 'CODE_ATTEMPTS_EXCEEDED') {
          return {
            success: false,
            maxAttemptsExceeded: true,
            error: errorMsg || 'Superaste el número de intentos permitidos. Solicita un código nuevo',
          };
        }

        return {
          success: false,
          error: errorMsg || 'El código ingresado no es correcto. Intenta nuevamente',
        };
      }

      return {
        success: true,
        message: data?.data?.message || 'Correo verificado correctamente',
      };
    } catch {
      return {
        success: false,
        error: 'No fue posible conectar con el servidor de verificación',
      };
    }
  }

  /**
   * Solicita el reenvío de un nuevo código OTP, invalidando el anterior.
   */
  async resendOtp(payload: ResendOtpPayload): Promise<ResendOtpResponse> {
    try {
      if (!payload.sessionToken) {
        return {
          success: false,
          error: 'La sesión de registro venció. Inicia el registro nuevamente',
        };
      }

      const response = await fetch(`${this.baseUrl}/api/v1/email-verification/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: payload.sessionToken,
          email: payload.email,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = readApiError(data, 'No fue posible reenviar el código. Intenta de nuevo más tarde').message;
        return {
          success: false,
          error: errorMsg || 'No fue posible reenviar el código. Intenta de nuevo más tarde',
        };
      }

      const resData = data?.data;
      return {
        success: true,
        message: 'Código reenviado con éxito',
        maskedEmail: resData?.maskedEmail,
        cooldownSeconds: resData?.resendAvailableInSeconds || 30,
        expiresInSeconds: resData?.expiresInSeconds || 300,
      };
    } catch {
      return {
        success: false,
        error: 'No fue posible conectar con el servidor de correo',
      };
    }
  }
}

export const emailVerificationService = new EmailVerificationService();
