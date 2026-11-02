"use client";

import { useEffect, useRef } from "react";
import { SurveyOfflineBanner } from "./survey-offline-banner";

export interface SurveyReviewAnswer {
  id: string;
  question: string;
  answer: string | number | null | undefined;
  section?: string;
  /** Permite que condición laboral ocupe toda la fila del resumen. */
  fullWidth?: boolean;
}

interface SurveyReviewModalProps {
  isOpen: boolean;
  answers: SurveyReviewAnswer[];
  isSubmitting?: boolean;
  submitStatus?: 'idle' | 'success' | 'error';
  submitMessage?: string | null;
  isConnectionError?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SurveyReviewModal({
  isOpen,
  answers,
  isSubmitting = false,
  submitStatus = 'idle',
  submitMessage = null,
  isConnectionError = false,
  onClose,
  onConfirm,
}: SurveyReviewModalProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement;
    titleRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }

      if (event.key === "Tab") {
        const controls = modalRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );

        if (!controls?.length) return;

        const first = controls[0];
        const last = controls[controls.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-busy={isSubmitting}
        aria-labelledby="survey-review-title"
        aria-describedby="survey-review-description"
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#c9c1b1] bg-white shadow-2xl"
      >
        <div className="border-b border-[#c9c1b1] px-7 py-7 sm:px-14 sm:py-9">
          <h2
            id="survey-review-title"
            ref={titleRef}
            tabIndex={-1}
            className="text-3xl font-bold tracking-tight text-[#1b2632] sm:text-4xl"
          >
            Revisa tus respuestas antes de enviar
          </h2>

          <p
            id="survey-review-description"
            className="mt-3 text-lg text-[#4f4f4f]"
          >
            Comprueba los datos. Puedes volver a editarlos antes de confirmar.
          </p>
        </div>

        <div className="space-y-3 px-7 pt-3 sm:px-14">
          {/* T3.6: el aviso offline debe ser visible incluso con el modal abierto. */}
          <SurveyOfflineBanner />
          {isSubmitting && (
            <p role="status" aria-live="polite" className="mb-4 rounded-lg border border-abyssal-blue/30 bg-palladian p-3 text-abyssal-blue">
              Enviando encuesta...
            </p>
          )}
          {submitMessage && (
            <div
              role={submitStatus === 'error' ? 'alert' : 'status'}
              className={`mb-4 rounded-lg border p-4 text-sm ${submitStatus === 'error'
                ? 'border-red-300 bg-red-50 text-red-800'
                : 'border-green-300 bg-green-50 text-green-800'}`}
            >
              <p className="font-semibold">{submitMessage}</p>
              {submitStatus === 'error' && (
                <p className="mt-1">Tus respuestas se conservaron. Puedes reintentar o volver a editarlas.</p>
              )}
              {submitStatus === 'error' && isConnectionError && (
                <p className="mt-1">No fue posible conectar con el servidor. Comprueba la conexión e intenta nuevamente.</p>
              )}
            </div>
          )}
        </div>
        <div className="overflow-y-auto px-7 py-6 sm:px-14 sm:py-9">
          {answers.length === 0 ? (
            <p className="rounded-xl border border-[#c9c1b1] bg-[#f5f3ee] p-5 text-sm text-[#4f4f4f]">
              No hay respuestas disponibles para revisar.
            </p>
          ) : (
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {answers.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border border-[#c9c1b1] bg-[#f5f3ee] px-6 py-5 ${item.fullWidth ? 'sm:col-span-2' : ''}`}
                >
                  {item.section && (
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#2c3b4d]">
                      {item.section}
                    </p>
                  )}

                  <dt className="text-xl font-bold text-[#4f4f4f]">{item.question}</dt>

                  <dd className="mt-3 break-words text-2xl text-[#1b2632]">
                    {item.answer === null ||
                    item.answer === undefined ||
                    item.answer === ""
                      ? "Sin respuesta"
                      : String(item.answer)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex flex-col-reverse gap-4 border-t border-[#c9c1b1] px-7 py-6 sm:flex-row sm:justify-end sm:px-14 sm:py-8">
          {/*
            Integración T2.5/T1.2: cerrar el modal debe devolver el foco al
            formulario y permitir editar las respuestas sin perder el estado.
          */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-[#c9c1b1] px-8 py-4 text-xl font-semibold text-[#1b2632] hover:bg-[#f5f3ee] disabled:opacity-50"
          >
            {submitStatus === 'success' ? 'Cerrar' : 'Volver y editar'}
          </button>

          {/*
            Integración T3.4: el contenedor debe pasar aquí el handler que
            ejecuta useSurveySubmit con el payload de useSurveyForm.
          */}
          {submitStatus !== 'success' && <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || answers.length === 0}
            className="rounded-xl bg-[#1b2632] px-8 py-4 text-xl font-semibold text-white hover:bg-[#2c3b4d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : submitStatus === 'error' ? "Reintentar envío" : "Confirmar y enviar"}
          </button>}
        </div>
      </div>
    </div>
  );
}
