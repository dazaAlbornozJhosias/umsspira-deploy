"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "../hooks/use-auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

// Íconos en línea para no agregar dependencias nuevas
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

const AtIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
  </Icon>
);
const KeyIcon = () => (
  <Icon>
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </Icon>
);
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
  "flex items-center gap-3 rounded-lg border bg-transparent px-3.5 text-gray-500 focus-within:ring-2 focus-within:ring-burning-flame";
const fieldInput =
  "w-full bg-transparent py-3.5 text-sm text-abyssal-blue outline-none placeholder:text-gray-400";
const labelClass = "block text-sm font-semibold text-abyssal-blue";

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
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="email" className={labelClass}>
            Correo electrónico <span className="text-truffle-trouble">*</span>
          </label>
          <span className="text-xs text-gray-500">Institucional</span>
        </div>
        <div className={`${fieldWrapper} ${fieldState(Boolean(fieldErrors.email))}`}>
          <AtIcon />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ejemplo@correo.umss.edu.bo"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-required="true"
            className={fieldInput}
          />
        </div>
        {fieldErrors.email && <p className="text-xs text-truffle-trouble">{fieldErrors.email}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className={labelClass}>
          Contraseña <span className="text-truffle-trouble">*</span>
        </label>
        <div className={`${fieldWrapper} ${fieldState(Boolean(fieldErrors.password))}`}>
          <KeyIcon />
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
        {fieldErrors.password && <p className="text-xs text-truffle-trouble">{fieldErrors.password}</p>}
      </div>

      

      {error && (
        <p role="alert" className="rounded-lg bg-truffle-trouble/10 px-3 py-2 text-sm text-truffle-trouble">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-burning-flame px-4 py-3.5 text-sm font-bold text-abyssal-blue shadow-sm transition hover:brightness-95 disabled:opacity-60"
      >
        {isLoading ? "Ingresando..." : "Ingresar →"}
      </button>

      <hr className="border-oatmeal" />

      <div className="flex items-start gap-3 rounded-lg border border-oatmeal bg-[#E7E2D6] px-3.5 py-3 text-[13px] leading-snug text-abyssal-blue">
        <span className="mt-0.5 shrink-0">
          <LockIcon />
        </span>
        <p>
          Acceso protegido para Administradores del Sistema, Decanaturas y Titulados debidamente
          registrados.
        </p>
      </div>

      <p className="text-center text-sm text-gray-500">
        ¿Aún no te has registrado?{" "}
        <Link
          href="/register"
          className="font-semibold text-abyssal-blue underline underline-offset-4 hover:text-truffle-trouble"
        >
          Inicia tu registro aquí
        </Link>
      </p>
    </form>
  );
}