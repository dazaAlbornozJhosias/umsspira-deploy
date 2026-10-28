'use client';

import React, { useEffect, useRef } from 'react';
import { useEmailVerificationStore } from '../store/email-verification.store';
import { useRegistrationStore } from '@/modules/registration/frontend/store';
import { useCountdown } from '../hooks/use-countdown';
import { OtpInput } from './otp-input';
import { ResendCodeButton } from './resend-code-button';
import { Button } from '@/shared/components/button';
import {
  ShieldCheck,
  MailCheck,
  KeyRound,
  Lock,
  Timer,
  Info,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Mail,
} from 'lucide-react';

export interface VerifyEmailFormProps {
  onSuccess?: () => void;
  onEditData?: () => void;
  initialEmail?: string;
  variant?: 'initial' | 'update';
  onBackToReview?: () => void;
}

export const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({
  onSuccess,
  onEditData,
  initialEmail,
  variant = 'initial',
  onBackToReview,
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

  // La vigencia se actualiza con la respuesta del servidor al emitir el OTP.
  const { formattedTime, reset: resetOtpTimer } = useCountdown({
    initialSeconds: 300,
    autoStart: true,
    onExpire: () => {
      setIsExpired(true);
    },
  });

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

    if (token && !useEmailVerificationStore.getState().isVerified && !hasRequestedRef.current) {
      hasRequestedRef.current = true;
      void resendCode().then((ok) => {
        if (ok) resetOtpTimer(useEmailVerificationStore.getState().expiresInSeconds);
      });
    }
  }, [initialEmail, setEmail, setSessionToken, resendCode, resetOtpTimer]);

  const isUpdate = variant === 'update';
  const isCodeComplete = otpDigits.every((d) => d.trim() !== '');
  const filledCount = otpDigits.filter((d) => d.trim() !== '').length;
  const nextDigit = Math.min(filledCount + 1, 6);

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
      resetOtpTimer(useEmailVerificationStore.getState().expiresInSeconds);
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
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-oatmeal bg-white p-6 sm:p-10 shadow-sm text-abyssal-blue">
      {/* Encabezado institucional */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-abyssal-blue text-white">
            <MailCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-burning-flame px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-abyssal-blue">
              {isUpdate ? <Mail className="h-3.5 w-3.5" aria-hidden="true" /> : <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />}
              {isUpdate ? 'Actualización de correo electrónico' : 'Token institucional'}
            </span>
            <p className="mt-1 text-xs text-abyssal-blue/70">
              {isUpdate ? 'Protocolo de validación segura v2.4' : 'Protocolo de validación segura'}
            </p>
          </div>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-oatmeal text-abyssal-blue/70">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight">
        {isUpdate ? 'Verifica tu nuevo correo electrónico' : 'Verifica tu correo electrónico'}
      </h1>
      <p className="mt-2 text-sm text-abyssal-blue/75">
        {isUpdate ? (
          <>
            Modificaste tu dirección de contacto. Necesitamos verificar el nuevo correo{' '}
            <strong className="font-mono font-bold text-abyssal-blue">{maskedEmail}</strong> antes de formalizar la
            entrega de tu solicitud.
          </>
        ) : (
          <>
            Hemos enviado un código de seguridad de 6 dígitos a{' '}
            <strong className="font-mono font-bold text-abyssal-blue">{maskedEmail}</strong> para validar tu registro
            oficial en el padrón universitario.
          </>
        )}
      </p>

      {isUpdate && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-oatmeal bg-palladian/60 p-4">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-abyssal-blue">Tus datos previos permanecen intactos</p>
            <p className="mt-1 text-xs leading-relaxed text-abyssal-blue/75">
              Todos tus otros datos biográficos, el historial de trámites y el archivo PDF adjunto se conservarán
              automáticamente para la revisión final.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Entrada OTP de 6 casillas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-semibold">Código de autenticación (6 dígitos):</span>
            <span aria-live="polite" className="shrink-0 text-xs text-abyssal-blue/70">
              Dígito {nextDigit} de 6
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
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Mensaje de éxito si ya está verificado */}
        {isVerified && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {isUpdate
                ? '¡Correo verificado! Vuelve al resumen para entregar tu solicitud.'
                : '¡Correo verificado exitosamente! Ya puedes continuar con la carga de respaldo.'}
            </span>
          </div>
        )}

        {/* Temporizador de vigencia (CA-02.1, CA-02.4) */}
        <div className="flex flex-col gap-3 rounded-xl border border-oatmeal bg-palladian/60 p-4 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Timer className="h-5 w-5 text-blue-fantastic" aria-hidden="true" />
            El código expirará en:
            <span className="rounded-md border border-oatmeal bg-white px-2.5 py-1 font-mono text-sm font-bold tabular-nums">
              {isExpired ? 'Expirado' : formattedTime}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-abyssal-blue/70 sm:ml-auto">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            Válido solo para esta sesión
          </p>
        </div>

        {/* Ayuda si no llega el correo */}
        <div className="flex items-start gap-2 text-xs leading-relaxed text-abyssal-blue/80">
          <Mail className="h-4 w-4 shrink-0 mt-0.5 text-blue-fantastic" aria-hidden="true" />
          <p>
            <strong>¿No recibiste el correo?</strong> Revisa tu bandeja de entrada o la carpeta de{' '}
            <strong>spam o correos no deseados</strong>.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={!isCodeComplete || isSubmitting || isExpired || maxAttemptsReached || isVerified}
            className="bg-burning-flame text-abyssal-blue hover:bg-burning-flame/90 hover:text-abyssal-blue disabled:hover:bg-burning-flame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-abyssal-blue focus-visible:ring-offset-2 inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-bold shadow-sm transition disabled:opacity-60"
          >
            {isSubmitting ? (
              'Validando código...'
            ) : isVerified ? (
              'Correo verificado'
            ) : (
              <>
                {isUpdate ? 'Verificar nuevo correo' : 'Verificar correo'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
          <ResendCodeButton
            onResend={handleResend}
            cooldownSeconds={cooldownSeconds}
            isResending={isResending}
            disabled={isSubmitting || isVerified}
            className="rounded-lg border border-oatmeal bg-white px-5 py-2.5 text-sm font-semibold text-abyssal-blue hover:bg-palladian"
          />
        </div>

        {isUpdate && onBackToReview && (
          <div className="text-center">
            <button
              type="button"
              onClick={onBackToReview}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-truffle-trouble hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Volver al resumen de revisión</span>
            </button>
          </div>
        )}

        {!isUpdate && onEditData && (
          <div className="text-center">
            <button
              type="button"
              onClick={onEditData}
              className="inline-flex items-center gap-1.5 text-xs text-abyssal-blue/80 hover:text-blue-fantastic hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Corregir mis datos</span>
            </button>
          </div>
        )}

        {/* Pie de seguridad */}
        <p className="flex items-center justify-center gap-2 border-t border-oatmeal/60 pt-4 text-center text-[11px] text-abyssal-blue/60">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
          {isUpdate
            ? 'Protegido por el Sistema Institucional UMSSPIRA bajo el Protocolo Criptográfico de Certificación Universitaria.'
            : 'Protegido por el Sistema Institucional UMSSPIRA.'}
        </p>
      </form>
    </div>
  );
};
