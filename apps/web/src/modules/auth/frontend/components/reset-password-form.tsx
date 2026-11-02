"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import {
  RecoveryLinkError,
  resetPassword,
  validateRecoveryLink,
  type RecoveryLinkFailure,
} from "../services/password-recovery.service";
import { evaluatePassword } from "../services/password-policy";

type Status = "checking" | "ready" | "submitting" | "success" | "link-error";

const LINK_ERROR_MESSAGES: Record<RecoveryLinkFailure, string> = {
  expired: "El enlace venció. Solicita uno nuevo para continuar.",
  used: "Este enlace ya se usó. Solicita uno nuevo si lo necesitas.",
  replaced: "Este enlace fue reemplazado por uno más reciente. Revisa tu correo o solicita otro.",
  invalid: "El enlace no es válido. Solicita uno nuevo para continuar.",
};
const GENERIC_ERROR_MESSAGE = "No fue posible cambiar la contraseña. Inténtalo nuevamente.";
const CHECK_ERROR_MESSAGE = "No fue posible comprobar el enlace. Inténtalo nuevamente.";

const fieldWrapper =
  "flex items-center gap-3 rounded-lg border border-oatmeal bg-[#F5F2EA]/80 px-3.5 text-gray-500 transition-colors focus-within:border-burning-flame focus-within:bg-white focus-within:ring-2 focus-within:ring-burning-flame/30";
const fieldInput =
  "w-full bg-transparent py-3.5 text-sm text-abyssal-blue outline-none placeholder:text-gray-400 disabled:opacity-60";
const labelClass = "block text-xs font-bold uppercase tracking-wider text-abyssal-blue";
const linkClass =
  "font-bold text-abyssal-blue underline underline-offset-4 hover:text-truffle-trouble";
const primaryButton =
  "flex w-full items-center justify-center rounded-lg bg-burning-flame px-4 py-3.5 text-sm font-bold text-abyssal-blue shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

function PasswordField({ id, label, value, disabled, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelClass}>
        {label}
        <span className="text-truffle-trouble"> *</span>
      </label>
      <div className={fieldWrapper}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-required="true"
          className={fieldInput}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="p-1 text-gray-500 transition hover:text-abyssal-blue"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  // El token se lee una sola vez; luego se quita de la URL para que no quede en el historial.
  const [token] = useState(() => searchParams.get("token")?.trim() ?? "");
  const [status, setStatus] = useState<Status>(token ? "checking" : "link-error");
  const [linkFailure, setLinkFailure] = useState<RecoveryLinkFailure>("invalid");
  const [checkError, setCheckError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) return;

    validateRecoveryLink(token)
      .then(() => setStatus("ready"))
      .catch((error: unknown) => {
        if (error instanceof RecoveryLinkError) {
          setLinkFailure(error.reason);
          setStatus("link-error");
        } else {
          setCheckError(CHECK_ERROR_MESSAGE);
          setStatus("link-error");
        }
      });
  }, [token]);

  const rules = evaluatePassword(password, confirmation);
  const submitting = status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !rules.allValid) return;

    setSubmitError(null);
    setStatus("submitting");
    try {
      await resetPassword(token, password);
      setPassword("");
      setConfirmation("");
      setStatus("success");
    } catch (error) {
      if (error instanceof RecoveryLinkError) {
        setLinkFailure(error.reason);
        setStatus("link-error");
        return;
      }
      setSubmitError(GENERIC_ERROR_MESSAGE);
      setStatus("ready");
    }
  }

  if (status === "checking") {
    return (
      <p role="status" className="text-sm text-abyssal-blue/70">
        Comprobando el enlace...
      </p>
    );
  }

  if (status === "link-error") {
    return (
      <div className="space-y-5">
        <p
          role="alert"
          className="rounded-lg bg-truffle-trouble/10 px-3 py-3 text-sm text-truffle-trouble"
        >
          {checkError ?? LINK_ERROR_MESSAGES[linkFailure]}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link href="/forgot-password" className={linkClass}>
            Solicitar otro enlace
          </Link>
          <Link href="/login" className={linkClass}>
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-5">
        <p
          role="status"
          className="rounded-lg border border-oatmeal border-l-4 border-l-burning-flame bg-palladian px-3 py-3 text-sm text-abyssal-blue"
        >
          Tu contraseña fue cambiada. Por seguridad, se cerraron tus sesiones anteriores.
          Inicia sesión con tu nueva contraseña.
        </p>
        <Link href="/login" className={primaryButton}>
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  const requirements: Array<[boolean, string]> = [
    [rules.hasMinLength, "Entre 8 y 128 caracteres"],
    [rules.hasUppercase, "Al menos una letra mayúscula"],
    [rules.hasLowercase, "Al menos una letra minúscula"],
    [rules.hasNumber, "Al menos un número"],
    [rules.hasSymbol, "Al menos un símbolo (por ejemplo ! @ # $ %)"],
    [rules.passwordsMatch, "Ambas contraseñas coinciden"],
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <PasswordField
        id="new-password"
        label="Nueva contraseña"
        value={password}
        disabled={submitting}
        onChange={setPassword}
      />
      <PasswordField
        id="confirm-password"
        label="Confirmar contraseña"
        value={confirmation}
        disabled={submitting}
        onChange={setConfirmation}
      />

      <ul aria-label="Requisitos de la contraseña" className="space-y-1.5 text-xs">
        {requirements.map(([met, text]) => (
          <li
            key={text}
            className={`flex items-center gap-2 ${
              met ? "font-medium text-emerald-700" : "text-abyssal-blue/60"
            }`}
          >
            <Check
              className={`h-3.5 w-3.5 ${met ? "text-emerald-600" : "text-gray-300"}`}
              aria-hidden="true"
            />
            <span>{text}</span>
          </li>
        ))}
      </ul>

      {submitError && (
        <p
          role="alert"
          className="rounded-lg bg-truffle-trouble/10 px-3 py-2 text-sm text-truffle-trouble"
        >
          {submitError}
        </p>
      )}

      <button type="submit" disabled={!rules.allValid || submitting} className={primaryButton}>
        {submitting ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}