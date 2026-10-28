"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { requestPasswordRecovery } from "../services/password-recovery.service";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENT_MESSAGE =
  "Si existe una cuenta activa asociada a ese correo, te enviaremos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.";
const REQUEST_ERROR_MESSAGE = "No fue posible procesar la solicitud. Inténtalo nuevamente.";

type Status = "idle" | "sending" | "sent";

const fieldWrapper =
  "flex items-center gap-3 rounded-lg border bg-[#F5F2EA]/80 px-3.5 text-gray-500 transition-colors focus-within:border-burning-flame focus-within:bg-white focus-within:ring-2 focus-within:ring-burning-flame/30";
const fieldInput =
  "w-full bg-transparent py-3.5 text-sm text-abyssal-blue outline-none placeholder:text-gray-400";
const labelClass = "block text-xs font-bold uppercase tracking-wider text-abyssal-blue";
const linkClass =
  "font-bold text-abyssal-blue underline underline-offset-4 hover:text-truffle-trouble";

function MailIcon() {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  function validateEmail(): string | null {
    const value = email.trim();
    if (!value) return "Ingresa tu correo electrónico";
    if (!EMAIL_PATTERN.test(value)) return "Ingresa un correo electrónico válido";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateEmail();
    setEmailError(validationError);
    setRequestError(null);
    if (validationError) return;

    setStatus("sending");
    try {
      await requestPasswordRecovery(email.trim());
      setStatus("sent");
    } catch {
      setRequestError(REQUEST_ERROR_MESSAGE);
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="space-y-5">
        <p
           role="status"
           className="rounded-lg border border-oatmeal border-l-4 border-l-burning-flame bg-palladian px-3 py-3 text-sm text-abyssal-blue"
        >
           {SENT_MESSAGE}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <button type="button" onClick={() => setStatus("idle")} className={linkClass}>
            Usar otro correo
          </button>
          <Link href="/login" className={linkClass}>
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className={labelClass}>
          CORREO ELECTRÓNICO
          <span className="text-truffle-trouble"> *</span>
        </label>
        <div
          className={`${fieldWrapper} ${
            emailError ? "border-truffle-trouble ring-2 ring-truffle-trouble" : "border-oatmeal"
          }`}
        >
          <MailIcon />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="alumni.sistemas@umss.edu.bo"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-required="true"
            className={fieldInput}
          />
        </div>
        {emailError && <p className="text-xs text-truffle-trouble">{emailError}</p>}
      </div>

      {requestError && (
        <p
          role="alert"
          className="rounded-lg bg-truffle-trouble/10 px-3 py-2 text-sm text-truffle-trouble"
        >
          {requestError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="flex w-full items-center justify-center rounded-lg bg-burning-flame px-4 py-3.5 text-sm font-bold text-abyssal-blue shadow-sm transition hover:brightness-95 disabled:opacity-60"
      >
        {status === "sending" ? "Enviando..." : "Enviar enlace"}
      </button>

      <p className="pt-2 text-center text-xs text-gray-500">
        <Link href="/login" className={linkClass}>
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}