"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { SurveyOfflineBanner } from "./survey-offline-banner";

type SubmissionVisualStatus = "sending" | "success" | "error";

interface SurveySubmissionStatusModalProps {
  isOpen: boolean;
  status: SubmissionVisualStatus;
  isConnectionError: boolean;
  onClose: () => void;
  onRetry: () => void;
}

/**
 * HU-003 / Epic 9 — estados de envío definitivos de Figma.
 * Desktop: nodos 51:126, 51:258 y 51:390.
 * Mobile: nodos 52:96, 52:197 y 52:299.
 * El modal de revisión (T2.5) permanece intacto para el estado idle.
 */
export function SurveySubmissionStatusModal({
  isOpen,
  status,
  isConnectionError,
  onClose,
  onRetry,
}: SurveySubmissionStatusModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (status !== "sending") onClose();
        else event.preventDefault();
      }
      if (event.key === "Tab") {
        if (status === "sending") {
          event.preventDefault();
          return;
        }
        const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [isOpen, status, onClose]);

  if (!isOpen) return null;

  const sending = status === "sending";
  const success = status === "success";
  const title = sending
    ? "Enviando encuesta..."
    : success
      ? "Encuesta enviada correctamente"
      : "No se pudo enviar la encuesta. Intente nuevamente";
  const asset = sending
    ? "/surveys/hu003-sending-ring.svg"
    : success
      ? "/surveys/hu003-success-ring.svg"
      : "/surveys/hu003-error-ring.svg";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="survey-status-title"
        aria-describedby="survey-status-description"
        aria-busy={sending}
        tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-[598px] overflow-y-auto rounded-[14px] border border-[#c9c1b1] bg-white px-5 pb-7 pt-7 text-center shadow-2xl outline-none sm:px-11 sm:pb-8"
      >
        {!sending && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar aviso"
            className="absolute right-3 top-2 flex h-8 w-8 items-center justify-center rounded text-[25px] font-medium leading-none text-[#444] hover:bg-[#f7f5f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2632]"
          >
            ×
          </button>
        )}

        <div className="relative mx-auto flex h-[72px] w-[72px] items-center justify-center">
          <Image alt="" aria-hidden="true" src={asset} width={72} height={72} unoptimized />
          <span
            aria-hidden="true"
            className={`absolute inset-0 flex items-center justify-center text-[31px] font-bold ${
              success ? "text-[#267451]" : sending ? "text-[#1b2632]" : "text-[#a35139]"
            }`}
          >
            {sending ? "•" : success ? "✓" : "!"}
          </span>
        </div>

        <h2
          id="survey-status-title"
          role={sending || success ? "status" : "alert"}
          aria-live={sending ? "polite" : "assertive"}
          className={`mx-auto mt-5 max-w-[514px] font-semibold leading-[1.35] ${
            sending ? "text-[21px] sm:text-[23px]" : "text-[19px] sm:text-[22px]"
          } ${status === "error" ? "text-[#a35139]" : "text-[#1b2632]"}`}
        >
          {title}
        </h2>

        <p
          id="survey-status-description"
          className="mx-auto mt-4 max-w-[505px] text-[12px] leading-5 text-[#444] sm:text-[13px]"
        >
          {sending
            ? "Estamos validando y registrando tus respuestas. Espera a que finalice el proceso."
            : success
              ? "Tus respuestas quedaron registradas. El formulario está completado y no puede enviarse de nuevo."
              : "No se confirmó el registro. Tus respuestas siguen disponibles y podrás reintentar."}
        </p>

        {sending ? (
          <div className="mx-auto mt-10 w-full max-w-[414px]">
            <div
              role="progressbar"
              aria-label="Envío de encuesta en curso"
              aria-valuetext="Procesando el envío"
              className="h-2 overflow-hidden rounded-full bg-[#f7f5f0]"
            >
              <div className="h-full w-[44%] animate-pulse rounded-full bg-[#1b2632] motion-reduce:animate-none" />
            </div>
            <p className="mt-5 text-[11px] leading-4 text-[#444] sm:text-[12px]">
              Mientras se procesa, el envío permanece bloqueado.
            </p>
          </div>
        ) : (
          <>
            {status === "error" && isConnectionError && (
              <p className="mx-auto mt-3 max-w-[490px] text-[12px] leading-5 text-[#a35139]">
                No fue posible conectar con el servidor. Comprueba tu conexión e intenta nuevamente.
              </p>
            )}
            {status === "error" && (
              <div className="mx-auto mt-8 max-w-[542px] border-t border-[#c9c1b1]" />
            )}
            <p className={`text-[11px] text-[#444] ${status === "error" ? "mt-3" : "mt-9"}`}>
              Cierra este aviso para continuar.
            </p>
            <div className={`flex flex-col items-center justify-center gap-3 sm:flex-row ${status === "error" ? "mt-5" : "mt-6"}`}>
              <button
                type="button"
                onClick={onClose}
                className={`h-[45px] w-full rounded-[7px] px-5 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2632] sm:w-[160px] ${
                  success
                    ? "bg-[#1b2632] text-white hover:bg-[#2c3b4d]"
                    : "border border-[#c9c1b1] bg-white text-[#1b2632] hover:bg-[#f7f5f0]"
                }`}
              >
                Cerrar
              </button>
              {status === "error" && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="h-[45px] w-full rounded-[7px] bg-[#1b2632] px-5 text-[13px] font-semibold text-white hover:bg-[#2c3b4d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b2632] sm:w-[198px]"
                >
                  Reintentar envío
                </button>
              )}
            </div>
          </>
        )}

        {status === "error" && (
          <div className="mx-auto mt-4 max-w-[505px] text-left">
            <SurveyOfflineBanner />
          </div>
        )}
      </div>
    </div>
  );
}
