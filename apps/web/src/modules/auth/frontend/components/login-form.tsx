"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "../hooks/use-auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Icono de sobre para el correo
const AtIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

// Icono de candado para la contraseña
const LockIcon = () => (
  <Icon>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);

const EyeIcon = () => (
  <Icon>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

const EyeOffIcon = () => (
  <Icon>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4-.8" />
  </Icon>
);

const fieldWrapper =
  "flex items-center gap-3 rounded-lg border bg-[#F5F2EA]/80 px-3.5 text-gray-500 transition-colors focus-within:border-burning-flame focus-within:bg-white focus-within:ring-2 focus-within:ring-burning-flame/30";
const fieldInput =
  "w-full bg-transparent py-3.5 text-sm text-abyssal-blue outline-none placeholder:text-gray-400";
const labelClass = "block text-xs font-bold uppercase tracking-wider text-abyssal-blue";

function fieldState(hasError: boolean) {
  return hasError ? "border-truffle-trouble ring-2 ring-truffle-trouble" : "border-oatmeal";
}

export function LoginForm() {
  const { signIn, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [reportsAccessNotice, setReportsAccessNotice] = useState(false);

  useEffect(() => {
    // El motivo lo añade el middleware tras rechazar una visita a /reports sin sesión.
    setReportsAccessNotice(
      new URLSearchParams(window.location.search).get('reportes') === 'requiere-sesion',
    );
  }, []);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "Ingresa tu correo electrónico";
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Ingresa un correo electrónico válido";
    if (!password) errors.password = "Ingresa tu contraseña";
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    await signIn({ email: email.trim(), password }, remember);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {reportsAccessNotice && (
        <p role="alert" className="rounded-lg border border-truffle-trouble bg-white px-3 py-2 text-sm text-abyssal-blue">
          Debe iniciar sesión para acceder a este módulo
        </p>
      )}
      {/* Campo de correo electrónico */}
      <div className="space-y-2">
        <label htmlFor="email" className={labelClass}>
          Correo electrónico
          <span className="text-truffle-trouble"> *</span>
        </label>

        <div
          className={`${fieldWrapper} ${fieldState(Boolean(fieldErrors.email))}`}
        >
          <AtIcon />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="alumni.sistemas@umss.edu.bo"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-required="true"
            className={fieldInput}
          />
        </div>
        {fieldErrors.email && <p className="text-xs text-truffle-trouble">{fieldErrors.email}</p>}
      </div>

      {/* Campo de contraseña */}
      <div className="space-y-2">
        <label htmlFor="password" className={labelClass}>
          Contraseña
          <span className="text-truffle-trouble"> *</span>
        </label>

        <div
          className={`${fieldWrapper} ${fieldState(Boolean(fieldErrors.password))}`}
        >
          <LockIcon />

          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-required="true"
            className={fieldInput}
          />

          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="text-gray-500 hover:text-abyssal-blue"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {/* Preferencia de sesión persistente */}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-abyssal-blue">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-oatmeal accent-abyssal-blue"
            />
            Recordar mi sesión en este equipo
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-bold text-abyssal-blue underline underline-offset-4 hover:text-truffle-trouble"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-truffle-trouble">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-truffle-trouble/10 px-3 py-2 text-sm text-truffle-trouble">
          {error}
        </p>
      )}

      {/* Botón principal de ingreso */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-burning-flame px-4 py-3.5 text-sm font-bold text-abyssal-blue shadow-sm transition hover:brightness-95 disabled:opacity-60"
      >
        {isLoading ? "Ingresando..." : "Ingresar al Portal ->"}
      </button>

      {/* Enlace para registro */}
      <p className="pt-2 text-center text-xs text-gray-500">
        ¿Aún no te has registrado?{" "}
        <Link
          href="/register"
          className="font-bold text-abyssal-blue underline underline-offset-4 hover:text-truffle-trouble"
        >
          Inicia tu registro aquí
        </Link>
      </p>
    </form>
  );
}
