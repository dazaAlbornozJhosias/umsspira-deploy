'use client';

import React, { useEffect, useRef } from 'react';
import { useEmailVerificationStore } from '../store/email-verification.store';
import { useRegistrationStore } from '@/modules/registration/frontend/store';
import { useCountdown } from '../hooks/use-countdown';
import { OtpInput } from './otp-input';
import { ResendCodeButton } from './resend-code-button';
import { Button } from '@/shared/components/button';
import { ShieldCheck, Mail, ArrowLeft, AlertCircle, Info } from 'lucide-react';

export interface VerifyEmailFormProps {
  onSuccess?: () => void;
  onEditData?: () => void;
  initialEmail?: string;
}

export const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({
  onSuccess,
  onEditData,
  initialEmail,
}) => {
  const {
    maskedEmail,
    otpDigits,
    isSubmitting,
    isResending,
    isVerified,
    error,
    isExpired,
    maxAttemptsReached,
    cooldownSeconds,
    setEmail,
    setSessionToken,
    setOtpDigit,
    setFullOtp,
    setIsExpired,
    verifyCode,
    resendCode,
  } = useEmailVerificationStore();

  const hasRequestedRef = useRef(false);

  useEffect(() => {
    const regState = useRegistrationStore.getState();
    const token = regState.sessionToken;
    const correo = initialEmail || regState.personalData?.correo;

    if (token) {
      setSessionToken(token);
    }
    if (correo) {
      setEmail(correo);
    }

    if (token && !isVerified && !hasRequestedRef.current) {
      hasRequestedRef.current = true;
      resendCode();
    }
  }, [initialEmail, setEmail, setSessionToken, isVerified, resendCode]);

  // Temporizador principal de 5 minutos (300 segundos) para la expiración del código (CA-02.1, CA-02.4)
  const { formattedTime, reset: resetOtpTimer } = useCountdown({
    initialSeconds: 300,
    autoStart: true,
    onExpire: () => {
      setIsExpired(true);
    },
  });

  const isCodeComplete = otpDigits.every((d) => d.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeComplete || isSubmitting) return;

    await verifyCode(() => {
      onSuccess?.();
    });
  };

  const handleResend = async () => {
    const ok = await resendCode();
    if (ok) {
      resetOtpTimer(300);
    }
  };

  const handleOtpChange = (digits: string[]) => {
    digits.forEach((digit, idx) => {
      if (otpDigits[idx] !== digit) {
        setOtpDigit(idx, digit);
      }
    });
    if (digits.every((d) => d === '')) {
      setFullOtp('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-oatmeal bg-white p-6 sm:p-10 shadow-sm text-abyssal">
      {/* Header Institucional */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-palladian text-blue-fantastic">
          <Mail className="h-7 w-7" />
        </div>
        <span className="inline-block rounded-full bg-palladian px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-truffle-trouble mb-2">
          Paso 2 de 3 · Verificación de Identidad
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-abyssal tracking-tight">
          Verifica tu correo electrónico
        </h1>
        <p className="mt-2 text-sm text-abyssal/75 max-w-md mx-auto">
          Hemos enviado un código numérico de 6 dígitos para validar tu identidad académica a:
        </p>
        <p className="mt-1 font-mono text-sm sm:text-base font-bold text-blue-fantastic">
          {maskedEmail}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entrada OTP de 6 casillas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-abyssal/70 px-1">
            <span className="font-medium">Código de 6 dígitos</span>
            <span
              className={`font-mono font-semibold ${
                isExpired ? 'text-truffle-trouble' : 'text-blue-fantastic'
              }`}
            >
              {isExpired ? 'Expirado' : `Expira en ${formattedTime} min`}
            </span>
          </div>

          <OtpInput
            value={otpDigits}
            onChange={handleOtpChange}
            hasError={Boolean(error)}
            disabled={isSubmitting || isVerified || isExpired || maxAttemptsReached}
          />
        </div>

        {/* Mensaje de error si corresponde */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-xs text-truffle-trouble font-medium"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Mensaje de éxito si ya está verificado */}
        {isVerified && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>¡Correo verificado exitosamente! Ya puedes continuar con la carga de respaldo.</span>
          </div>
        )}

        {/* Botón Principal */}
        <Button
          type="submit"
          variant="primary"
          disabled={!isCodeComplete || isSubmitting || isExpired || maxAttemptsReached || isVerified}
          className="w-full text-sm font-bold shadow-sm"
        >
          {isSubmitting
            ? 'Validando código...'
            : isVerified
            ? 'Correo Verificado'
            : 'Verificar código y continuar'}
        </Button>

        {/* Reenvío de código con Cooldown (CA-02.6) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-oatmeal/60 text-xs text-abyssal/80">
          <ResendCodeButton
            onResend={handleResend}
            cooldownSeconds={cooldownSeconds}
            isResending={isResending}
            disabled={isSubmitting || isVerified}
          />

          {onEditData && (
            <button
              type="button"
              onClick={onEditData}
              className="inline-flex items-center gap-1.5 text-xs text-abyssal hover:text-blue-fantastic hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Corregir mis datos</span>
            </button>
          )}
        </div>

        {/* Caja informativa de soporte */}
        <div className="rounded-xl bg-palladian/60 p-4 text-xs text-abyssal/80 border border-oatmeal/40 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-abyssal">
            <Info className="h-3.5 w-3.5 text-blue-fantastic" />
            <span>¿No recibiste el mensaje?</span>
          </div>
          <p className="leading-relaxed">
            Revisa tu carpeta de correo no deseado (spam) o espera a que el tiempo de expiración
            termine para solicitar un nuevo código institucional.
          </p>
        </div>

        {/* Pie de seguridad cifrada */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-abyssal/60 uppercase tracking-wider pt-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Cifrado de extremo a extremo · Servidor UMSS DTI</span>
        </div>
      </form>
    </div>
  );
};
