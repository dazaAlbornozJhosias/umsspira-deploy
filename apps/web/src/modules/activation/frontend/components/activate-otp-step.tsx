'use client';

import React, {
  useRef,
  useEffect,
  useState,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from 'react';
import { useActivation } from '../hooks/use-activation';
import {
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Clock,
  RotateCw,
  MailCheck,
  Info,
  Lock,
} from 'lucide-react';

export interface ActivateOtpStepProps {
  applicationId: string;
  email?: string;
  onSuccess?: (activationToken: string, maskedEmail: string) => void;
}

export const ActivateOtpStep: React.FC<ActivateOtpStepProps> = ({
  applicationId,
  email,
  onSuccess,
}) => {
  const {
    otpDigits,
    isLoading,
    expiresAt,
    isCodeComplete,
    maskedEmail,
    isVerifying,
    isResending,
    isLocked,
    error,
    successMessage,
    isOtpInvalidated,
    cooldownFormatted,
    handleDigitChange,
    handleFullOtp,
    verifyCode,
    resendCode,
  } = useActivation({
    applicationId,
    email,
    onSuccess,
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Foco automático en la primera casilla
    if (inputRefs.current[0] && !isVerifying && !isResending && !isOtpInvalidated) {
      inputRefs.current[0].focus();
    }
  }, [isVerifying, isResending, isOtpInvalidated]);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digit = raw.replace(/\D/g, '').slice(-1);
    handleDigitChange(index, digit);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        e.preventDefault();
        handleDigitChange(index - 1, '');
        inputRefs.current[index - 1]?.focus();
      } else if (otpDigits[index]) {
        e.preventDefault();
        handleDigitChange(index, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isVerifying || isResending || isOtpInvalidated) return;

    const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    handleFullOtp(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode();
  };

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-t-[6px] border-t-abyssal-blue border-oatmeal/70 bg-white p-6 shadow-xl shadow-abyssal-blue/5 sm:p-12">
      <div className="mb-6 flex items-center gap-4">
        <span className="rounded-2xl bg-abyssal-blue p-4 text-white"><MailCheck aria-hidden="true" className="h-7 w-7" /></span>
        <span className="rounded bg-blue-50 px-3 py-1 text-xs font-bold tracking-wide text-abyssal-blue">ACTIVACIÓN DE TITULADO</span>
      </div>
      {/* Insignia de Aprobación Administrativa (CA-06.2) */}
      <div className="sr-only">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          ¡Solicitud Aprobada!
        </span>

        <span className="inline-flex items-center gap-1.5 text-xs text-abyssal-blue/60">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Activación Oficial
        </span>
      </div>

      <div className="mt-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-abyssal-blue sm:text-4xl">
          Activa tu cuenta de Titulado
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-abyssal-blue/75">
          Tu expediente ha sido revisado y aprobado exitosamente por la administración. Hemos
          enviado un código de seguridad de 6 dígitos a{' '}
          <strong className="font-mono font-bold text-abyssal-blue">{maskedEmail}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Entrada OTP de 6 casillas (CA-06.2) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-abyssal-blue">
            <span>CÓDIGO DE ACTIVACIÓN (6 DÍGITOS) *</span>
            <span aria-live="polite" className="text-[11px] font-normal text-abyssal-blue/60">
              {otpDigits.filter((d) => d !== '').length} de 6 ingresados
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {Array.from({ length: 6 }).map((_, index) => {
              const digit = otpDigits[index];
              const isFilled = Boolean(digit);
              return (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading || isVerifying || isResending || isOtpInvalidated}
                  aria-label={`Dígito ${index + 1} de 6`}
                  placeholder={focusedIndex === index ? '' : '•'}
                  onFocus={(e) => {
                    setFocusedIndex(index);
                    e.target.select();
                  }}
                  onBlur={() => setFocusedIndex(null)}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`h-14 min-w-0 flex-1 rounded-xl text-center text-2xl font-bold outline-none transition-all sm:h-20 caret-burning-flame placeholder:text-abyssal-blue/25 focus:placeholder-transparent ${
                    isFilled ? 'bg-[#F5F2EA] text-abyssal-blue' : 'bg-[#F5F2EA]/60 text-abyssal-blue'
                  } border focus:border-2 focus:border-burning-flame focus:bg-white ${
                    error
                      ? 'border-2 border-truffle-trouble text-truffle-trouble'
                      : 'border-oatmeal'
                  } ${
                    isVerifying || isResending || isOtpInvalidated
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                />
              );
            })}
          </div>
        </div>

        <p className="text-xs text-abyssal-blue/65">Presiona las teclas numéricas o pega el código completo directamente.</p>
        <div className="flex items-center gap-3 rounded-xl border border-oatmeal bg-palladian p-4 text-sm text-abyssal-blue">
          <Clock aria-hidden="true" className="h-6 w-6 shrink-0" />
          <div><p className="font-semibold">El código de activación expirará en:</p>
            <p>{expiresAt ? new Date(expiresAt).toLocaleString('es-BO', { timeZone: 'America/La_Paz' }) + ' (hora de Bolivia)' : 'Consultando vigencia…'}</p>
            <p className="text-xs text-abyssal-blue/65">Válido por 24 horas desde su emisión.</p></div>
        </div>
        {isLocked && !isLoading && <div className="rounded-xl border border-truffle-trouble/30 bg-truffle-trouble/10 p-4 text-sm text-truffle-trouble">
          <p className="flex items-center gap-2 font-bold"><Lock aria-hidden="true" className="h-5 w-5" />El reenvío de códigos está bloqueado temporalmente</p>
          <p className="mt-2">Podrás solicitar un nuevo código en: <strong>{cooldownFormatted}</strong></p>
          <p className="mt-2 text-xs">Puedes continuar con el último código recibido si todavía está vigente.</p>
        </div>}
        <div className="flex items-start gap-3 rounded-xl border border-oatmeal bg-palladian/70 p-4 text-sm text-abyssal-blue/75">
          <Info aria-hidden="true" className="h-5 w-5 shrink-0" />
          <p>¿No recibiste el código? Revisa tu bandeja de entrada o la carpeta de spam / correos no deseados.</p>
        </div>
        {/* Mensaje de error (CA-06.4) */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-xs font-medium text-truffle-trouble"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Mensaje informativo o de reenvío exitoso */}
        {successMessage && !error && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Bloque de botones: «Siguiente» y «Reenviar código» debajo (CA-06.2, CA-06.5) */}
        <div className="space-y-3 pt-2">
          {/* Botón primario «Siguiente» */}
          <button
            type="submit"
            disabled={isLoading || !isCodeComplete || isVerifying || isResending || isOtpInvalidated}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-burning-flame px-4 py-3.5 text-sm font-bold text-abyssal-blue shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Validando código...</span>
              </>
            ) : (
              <>
                <span>Siguiente</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>

          {/* Botón secundario «Reenviar código» con bloqueo gris y cuenta regresiva (CA-06.5, CA-06.6) */}
          <button
            type="button"
            onClick={resendCode}
            disabled={isLocked || isResending || isVerifying}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              isLocked
                ? 'cursor-not-allowed border border-gray-300 bg-gray-200 text-gray-500 shadow-none'
                : 'border border-oatmeal bg-white text-abyssal-blue hover:bg-palladian disabled:opacity-50'
            }`}
          >
            {isResending ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Reenviando código...</span>
              </>
            ) : isLocked ? (
              <>
                <Clock className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span>Reenviar código en {cooldownFormatted}</span>
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                <span>Reenviar código</span>
              </>
            )}
          </button>
        </div>

        {/* Información de seguridad al pie de la tarjeta */}
        <div className="border-t border-oatmeal/60 pt-4 text-center text-xs text-abyssal-blue/70">
          <p className="flex items-center justify-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-burning-flame" aria-hidden="true" />
            El código tiene una vigencia de 24 horas a partir de su emisión.
          </p>
        </div>
      </form>
    </div>
  );
};
