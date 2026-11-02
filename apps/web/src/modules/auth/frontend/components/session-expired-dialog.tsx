"use client";

import { useEffect, useRef, useState } from "react";
import { authStore } from "../store";
import { clearSession } from "../services/session";
import { hardRedirect } from "../services/navigation";
import {
  SESSION_EXPIRED_EVENT,
  SESSION_EXPIRED_LOGIN_PATH,
} from "../services/session-expired";

/**
 * HU-004 CA-06: ventana de alerta cuando la sesión del administrador caduca.
 * Limpia el estado local de autenticación al aparecer y solo ofrece volver a
 * /login, para que no se pueda seguir usando el módulo con la sesión vencida.
 */
export function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleExpired = () => {
      clearSession();
      authStore.reset();
      setOpen(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  useEffect(() => {
    if (open) actionRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-abyssal-blue/60 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-description"
        className="w-full max-w-md rounded-xl border border-oatmeal bg-white p-6 shadow-xl"
      >
        <h2 id="session-expired-title" className="font-display text-xl font-bold text-abyssal-blue">
          Su sesión ha expirado
        </h2>
        <p id="session-expired-description" className="mt-2 text-sm text-abyssal-blue/80">
          Por seguridad, inicie sesión nuevamente para continuar.
        </p>
        <button
          ref={actionRef}
          type="button"
          onClick={() => hardRedirect(SESSION_EXPIRED_LOGIN_PATH)}
          className="mt-5 w-full rounded-md bg-abyssal-blue px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-burning-flame"
        >
          Iniciar sesión nuevamente
        </button>
      </div>
    </div>
  );
}
