'use client';

import React, { useState, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { activationService } from '../services/activation.service';

export interface ActivatePasswordStepProps {
  applicationId: string;
  activationToken: string;
  maskedEmail?: string;
  onSuccess?: () => void;
  onBackToOtp?: () => void;
}

export const ActivatePasswordStep: React.FC<ActivatePasswordStepProps> = ({
  applicationId,
  activationToken,
  maskedEmail,
  onSuccess,
  onBackToOtp,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validación de reglas de contraseña (CA-06.3)
  const rules = useMemo(() => {
    const hasMinLength = password.length >= 8 && password.length <= 128;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const passwordsMatch = password.length > 0 && password === confirmPassword;

    const allValid =
      hasMinLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSymbol &&
      passwordsMatch;

    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
      passwordsMatch,
      allValid,
    };
  }, [password, confirmPassword]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Protección contra doble clic / envío concurrente (CA-06.8)
    if (isSubmitting || !rules.allValid) return;

    if (!activationToken) {
      setError('El pase de activación no es válido o ha expirado. Valida el código otra vez.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await activationService.activateAccount({
        applicationId,
        activationToken,
        password,
      });

      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al activar la cuenta';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de confirmación de cuenta activada exitosamente (CA-06.9)
  if (isSuccess) {
    return (
      <div
        data-testid="activation-success-view"
        className="w-full max-w-3xl rounded-2xl border border-oatmeal/70 bg-white p-6 shadow-xl shadow-abyssal-blue/5 sm:p-12 text-center"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-burning-flame text-abyssal-blue ring-8 ring-burning-flame/20">
          <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
        </div>

        <div className="mt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Activación Completada
          </span>

          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-abyssal-blue sm:text-4xl">
            Cuenta activada exitosamente
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-abyssal-blue/75">
            Tu cuenta de titulado ha sido activada. Ya puedes iniciar sesión con tu
            correo verificado y la contraseña que acabas de configurar.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-burning-flame px-4 py-3.5 text-sm font-bold text-abyssal-blue shadow-sm transition hover:brightness-95"
          >
            <span>Iniciar sesión</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-oatmeal/70 bg-white p-6 shadow-xl shadow-abyssal-blue/5 sm:p-12">
      <div className="-mx-6 -mt-6 mb-8 flex items-center gap-3 rounded-t-2xl bg-[#101827] px-6 py-5 text-white sm:-mx-12 sm:-mt-12 sm:px-12">
        <Lock aria-hidden="true" className="h-6 w-6 text-burning-flame" />
        <span className="text-sm font-semibold tracking-wide">ACTIVACIÓN DE TITULADO</span>
      </div>
      {/* Insignia de paso */}
      <div className="sr-only">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
          <Lock className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
          Paso 2: Crear contraseña
        </span>

        <span className="inline-flex items-center gap-1.5 text-xs text-abyssal-blue/60">
          <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Activación Oficial
        </span>
      </div>

      <div className="mt-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-abyssal-blue sm:text-4xl">
          Crea tu nueva contraseña
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-abyssal-blue/75">
          El código OTP ha sido validado correctamente. Define tu contraseña segura para activar de
          forma definitiva tu cuenta institucional de Titulado UMSS.
        </p>
      </div>

      {maskedEmail && <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-oatmeal bg-[#F2EDE3] p-4 text-sm">
        <span className="font-semibold text-abyssal-blue">{maskedEmail}</span>
        <span className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" />Código verificado</span>
      </div>}
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Campo «Nueva contraseña» */}
        <div className="space-y-1.5">
          <label
            htmlFor="new-password"
            className="block text-xs font-semibold uppercase tracking-wider text-abyssal-blue"
          >
            Nueva contraseña *
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
              className="w-full rounded-xl border border-oatmeal bg-[#F5F2EA]/60 px-4 py-3.5 pr-11 text-sm font-medium text-abyssal-blue outline-none transition focus:border-2 focus:border-burning-flame focus:bg-white disabled:opacity-50 placeholder:text-abyssal-blue/30 focus:placeholder-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-abyssal-blue/60 hover:text-abyssal-blue transition"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Campo «Verificar contraseña» */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirm-password"
            className="block text-xs font-semibold uppercase tracking-wider text-abyssal-blue"
          >
            Verificar contraseña *
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="••••••••"
              className="w-full rounded-xl border border-oatmeal bg-[#F5F2EA]/60 px-4 py-3.5 pr-11 text-sm font-medium text-abyssal-blue outline-none transition focus:border-2 focus:border-burning-flame focus:bg-white disabled:opacity-50 placeholder:text-abyssal-blue/30 focus:placeholder-transparent"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword
                  ? 'Ocultar verificación de contraseña'
                  : 'Mostrar verificación de contraseña'
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-abyssal-blue/60 hover:text-abyssal-blue transition"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Lista visual de requisitos de contraseña (CA-06.3) */}
        <div className="rounded-xl border border-oatmeal/80 bg-[#F5F2EA]/40 p-4 space-y-2 text-xs">
          <span className="font-semibold text-abyssal-blue block mb-1">
            Requisitos de seguridad:
          </span>
          <ul className="space-y-1.5 text-abyssal-blue/80">
            <li
              className={`flex items-center gap-2 ${
                rules.hasMinLength ? 'text-emerald-700 font-medium' : 'text-abyssal-blue/60'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  rules.hasMinLength ? 'text-emerald-600' : 'text-gray-300'
                }`}
              />
              <span>Mínimo 8 caracteres</span>
            </li>
            <li
              className={`flex items-center gap-2 ${
                rules.hasUppercase ? 'text-emerald-700 font-medium' : 'text-abyssal-blue/60'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  rules.hasUppercase ? 'text-emerald-600' : 'text-gray-300'
                }`}
              />
              <span>Al menos una letra mayúscula</span>
            </li>
            <li
              className={`flex items-center gap-2 ${
                rules.hasLowercase ? 'text-emerald-700 font-medium' : 'text-abyssal-blue/60'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  rules.hasLowercase ? 'text-emerald-600' : 'text-gray-300'
                }`}
              />
              <span>Al menos una letra minúscula</span>
            </li>
            <li
              className={`flex items-center gap-2 ${
                rules.hasNumber ? 'text-emerald-700 font-medium' : 'text-abyssal-blue/60'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  rules.hasNumber ? 'text-emerald-600' : 'text-gray-300'
                }`}
              />
              <span>Al menos un número</span>
            </li>
            <li
              className={`flex items-center gap-2 ${
                rules.hasSymbol ? 'text-emerald-700 font-medium' : 'text-abyssal-blue/60'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  rules.hasSymbol ? 'text-emerald-600' : 'text-gray-300'
                }`}
              />
              <span>Al menos un carácter especial o símbolo (!@#$%^&*...)</span>
            </li>
            <li
              className={`flex items-center gap-2 ${
                rules.passwordsMatch ? 'text-emerald-700 font-medium' : 'text-abyssal-blue/60'
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  rules.passwordsMatch ? 'text-emerald-600' : 'text-gray-300'
                }`}
              />
              <span>Ambas contraseñas coinciden</span>
            </li>
          </ul>
        </div>

        {/* Mensaje de error (CA-06.8) */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-xs font-medium text-truffle-trouble"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <span>{error}</span>
              {onBackToOtp && error.toLowerCase().includes('código') && (
                <button
                  type="button"
                  onClick={onBackToOtp}
                  className="mt-2 block underline text-xs font-semibold hover:opacity-80"
                >
                  Volver a validar código OTP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botón primario «Activar cuenta» (CA-06.3, CA-06.8) */}
        <div className="pt-2">
          {onBackToOtp && <button type="button" onClick={onBackToOtp} disabled={isSubmitting}
            className="mb-4 rounded-lg border border-oatmeal bg-[#F2EDE3] px-5 py-3 text-sm font-semibold text-abyssal-blue disabled:opacity-50">Volver</button>}
          <button
            type="submit"
            disabled={!rules.allValid || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-burning-flame px-4 py-3.5 text-sm font-bold text-abyssal-blue shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Activando cuenta...</span>
              </>
            ) : (
              <>
                <span>Activar cuenta</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
