import { create } from 'zustand';
import { emailVerificationService } from '../services/email-verification.service';
import { useRegistrationStore } from '@/modules/registration/frontend/store';

/**
 * Enmascara un correo electrónico para proteger la privacidad según CA-02.1.
 * Ejemplo: juan.perez@gmail.com -> ju****z@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}****@${domain}`;
  }
  const firstTwo = localPart.slice(0, 2);
  const lastOne = localPart.slice(-1);
  return `${firstTwo}****${lastOne}@${domain}`;
}

export interface EmailVerificationState {
  email: string;
  maskedEmail: string;
  sessionToken: string | null;
  otpDigits: string[];
  isSubmitting: boolean;
  isResending: boolean;
  isVerified: boolean;
  error: string | null;
  attempts: number;
  isExpired: boolean;
  maxAttemptsReached: boolean;
  cooldownSeconds: number;

  setEmail: (email: string) => void;
  setSessionToken: (token: string | null) => void;
  setOtpDigit: (index: number, digit: string) => void;
  setFullOtp: (code: string) => void;
  clearOtp: () => void;
  setError: (error: string | null) => void;
  setIsExpired: (expired: boolean) => void;
  setCooldownSeconds: (seconds: number) => void;
  verifyCode: (onSuccess?: () => void) => Promise<boolean>;
  resendCode: () => Promise<boolean>;
  reset: () => void;
}

export const useEmailVerificationStore = create<EmailVerificationState>((set, get) => ({
  email: 'c.rodriguez@est.umss.edu',
  maskedEmail: maskEmail('c.rodriguez@est.umss.edu'),
  sessionToken: null,
  otpDigits: ['', '', '', '', '', ''],
  isSubmitting: false,
  isResending: false,
  isVerified: false,
  error: null,
  attempts: 0,
  isExpired: false,
  maxAttemptsReached: false,
  cooldownSeconds: 0,

  setEmail: (email: string) =>
    set({
      email,
      maskedEmail: maskEmail(email),
      error: null,
      isVerified: false,
      isExpired: false,
      maxAttemptsReached: false,
    }),

  setSessionToken: (sessionToken: string | null) => set({ sessionToken }),

  setOtpDigit: (index: number, digit: string) => {
    const { otpDigits } = get();
    if (index < 0 || index >= 6) return;
    const newDigits = [...otpDigits];
    newDigits[index] = digit.slice(-1); // Solo un caracter
    set({ otpDigits: newDigits, error: null });
  },

  setFullOtp: (code: string) => {
    const cleanDigits = code.replace(/\D/g, '').slice(0, 6).split('');
    const padded = [...cleanDigits, '', '', '', '', '', ''].slice(0, 6);
    set({ otpDigits: padded, error: null });
  },

  clearOtp: () => set({ otpDigits: ['', '', '', '', '', ''], error: null }),

  setError: (error: string | null) => set({ error }),

  setIsExpired: (isExpired: boolean) => {
    set({
      isExpired,
      error: isExpired ? 'El código expiró. Solicita uno nuevo' : null,
    });
  },

  setCooldownSeconds: (cooldownSeconds: number) => set({ cooldownSeconds }),

  verifyCode: async (onSuccess) => {
    let { email, otpDigits, sessionToken, attempts, isExpired, maxAttemptsReached } = get();

    if (!sessionToken && typeof window !== 'undefined') {
      const regSession = useRegistrationStore.getState().sessionToken;
      if (regSession) {
        sessionToken = regSession;
        set({ sessionToken: regSession });
      }
    }

    if (isExpired) {
      set({ error: 'El código expiró. Solicita uno nuevo' });
      return false;
    }

    if (maxAttemptsReached || attempts >= 5) {
      set({
        maxAttemptsReached: true,
        error: 'Superaste el número de intentos permitidos. Solicita un código nuevo',
      });
      return false;
    }

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      set({ error: 'Por favor, completa los 6 dígitos del código' });
      return false;
    }

    set({ isSubmitting: true, error: null });

    const response = await emailVerificationService.verifyOtp({
      email,
      code: fullCode,
      sessionToken: sessionToken ?? undefined,
    });

    set({ isSubmitting: false });

    if (response.success) {
      set({
        isVerified: true,
        error: null,
      });
      onSuccess?.();
      return true;
    }

    const nextAttempts = attempts + 1;
    if (response.maxAttemptsExceeded || nextAttempts >= 5) {
      set({
        attempts: nextAttempts,
        maxAttemptsReached: true,
        error: 'Superaste el número de intentos permitidos. Solicita un código nuevo',
      });
      return false;
    }

    if (response.isExpired) {
      set({
        isExpired: true,
        error: 'El código expiró. Solicita uno nuevo',
      });
      return false;
    }

    set({
      attempts: nextAttempts,
      error: response.error || 'El código ingresado no es correcto. Intenta nuevamente',
    });
    return false;
  },

  resendCode: async () => {
    let { email, sessionToken } = get();

    if (!sessionToken && typeof window !== 'undefined') {
      const regState = useRegistrationStore.getState();
      if (regState.sessionToken) {
        sessionToken = regState.sessionToken;
        set({ sessionToken });
      }
      if (regState.personalData?.correo) {
        email = regState.personalData.correo;
        set({ email, maskedEmail: maskEmail(email) });
      }
    }

    set({ isResending: true, error: null });

    const response = await emailVerificationService.resendOtp({
      email,
      sessionToken: sessionToken ?? undefined,
    });

    set({ isResending: false });

    if (response.success) {
      set({
        otpDigits: ['', '', '', '', '', ''],
        attempts: 0,
        isExpired: false,
        maxAttemptsReached: false,
        error: null,
        cooldownSeconds: response.cooldownSeconds || 30,
        ...(response.maskedEmail ? { maskedEmail: response.maskedEmail } : {}),
      });
      return true;
    }

    set({ error: response.error || 'No fue posible reenviar el código' });
    return false;
  },

  reset: () =>
    set({
      otpDigits: ['', '', '', '', '', ''],
      isSubmitting: false,
      isResending: false,
      isVerified: false,
      error: null,
      attempts: 0,
      isExpired: false,
      maxAttemptsReached: false,
      cooldownSeconds: 0,
    }),
}));
