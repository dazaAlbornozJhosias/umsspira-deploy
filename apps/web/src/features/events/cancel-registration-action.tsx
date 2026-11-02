"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import {
  EVENT_REGISTRATION_STATUS,
  type EventItem,
  type EventRegistrationStatus,
} from "@umsspira/shared-types";
import { ConfirmModal } from "@/shared/components/confirm-modal";
import { ApiClientError } from "@/shared/services/api-client";
import { SessionError } from "@/shared/services/auth-session";
import { formatEventSchedule } from "@/shared/utils/event-date-time";

type CancellationEvent = Pick<
  EventItem,
  "title" | "startDate" | "endDate" | "location"
>;
interface CancelRegistrationActionProps {
  event: CancellationEvent;
  status: EventRegistrationStatus;
  onConfirm: () => Promise<void>;
  onCancelled?: () => void;
  onConflict?: () => Promise<void>;
  variant?: "default" | "card";
}

function cancellationError(error: unknown): {
  title: string;
  message: string;
  retryable: boolean;
} {
  if (error instanceof SessionError || error instanceof ApiClientError) {
    if (error.status === 401) {
      return {
        title: "Inicia sesión para continuar",
        message:
          "Tu sesión ha finalizado. Inicia sesión nuevamente para continuar.",
        retryable: false,
      };
    }
    if (error.status === 403 || error.status === 404) {
      return {
        title: "Inscripción no disponible",
        message:
          "No se encontró una inscripción disponible para cancelar.",
        retryable: false,
      };
    }
    if (error.status === 409) {
      return {
        title: "Esta inscripción no admite cancelación",
        message:
          "La inscripción ya no permite cancelación. Actualiza el evento para consultar su estado.",
        retryable: false,
      };
    }
  }
  return {
    title: "No se pudo cancelar la inscripción",
    message:
      "No pudimos confirmar la cancelación. Comprueba el estado de tu inscripción antes de volver a intentarlo.",
    retryable: true,
  };
}

export function CancelRegistrationAction({
  event,
  status,
  onConfirm,
  onCancelled,
  onConflict,
  variant = "default",
}: CancelRegistrationActionProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [expired, setExpired] = useState(
    () => !(new Date(event.endDate).getTime() > Date.now()),
  );
  const [error, setError] = useState<ReturnType<
    typeof cancellationError
  > | null>(null);
  const inFlight = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const checkExpiry = () => {
      const remaining = new Date(event.endDate).getTime() - Date.now();
      setExpired(!(remaining > 0));
      if (remaining > 0) {
        timer = setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647));
      }
    };
    checkExpiry();
    return () => clearTimeout(timer);
  }, [event.endDate]);

  useEffect(() => {
    if (succeeded) successRef.current?.focus();
  }, [succeeded]);

  async function confirm() {
    if (
      inFlight.current ||
      succeeded ||
      status !== EVENT_REGISTRATION_STATUS.CONFIRMADA
    )
      return;
    if (!(new Date(event.endDate).getTime() > Date.now())) {
      setExpired(true);
      setOpen(false);
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (failure) {
      const result = cancellationError(failure);
      setError(result);
      if (!result.retryable) setOpen(false);
      if (failure instanceof ApiClientError && failure.status === 409 && onConflict) {
        try {
          await onConflict();
        } catch {
          // Si falla la sincronización, se conserva el rechazo original.
        }
      }
      return;
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
    setSucceeded(true);
    setOpen(false);
    onCancelled?.();
  }

  if (succeeded) {
    return (
      <div
        className="hu4-cancellation-success"
        ref={successRef}
        tabIndex={-1}
        role="status"
      >
        <CheckCircle2 aria-hidden="true" size={24} />
        <div>
          <h2>Cancelación realizada</h2>
          <p>
            Tu inscripción se canceló correctamente. El cupo se liberó y el pase
            QR asociado dejó de ser válido.
          </p>
          <div className="hu4-cancellation-event">
            <strong>{event.title}</strong>
            <span>{formatEventSchedule(event.startDate, event.endDate)}</span>
            <span className="hu4-cancellation-badge">CANCELADA</span>
          </div>
        </div>
      </div>
    );
  }

  if (status !== EVENT_REGISTRATION_STATUS.CONFIRMADA) return null;

  return (
    <div className={variant === "card" ? "hu4-cancellation hu4-cancellation--card" : "hu4-cancellation"}>
      {!open && error ? (
        <p className="hu4-cancellation-error" role="alert">
          {error.message}
        </p>
      ) : null}
      {expired ? (
        <p className="hu4-cancellation-note">
          El evento ha finalizado. Ya no es posible cancelar esta inscripción.
        </p>
      ) : (
        <button
          className="hu4-cancellation-trigger"
          type="button"
          disabled={error?.retryable === false}
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          {variant === "card" ? "Cancelar inscripción" : "Cancelar mi inscripción"}
        </button>
      )}
      <ConfirmModal
        className={error ? "hu4-cancellation-modal hu4-cancellation-modal--error" : "hu4-cancellation-modal"}
        open={open}
        icon={CircleAlert}
        title={error ? error.title : "Cancelar inscripción"}
        description={error ? (
          <p role="alert">{error.message}</p>
        ) : "Si confirmas, liberarás tu cupo y el pase QR asociado dejará de estar vigente."}
        cancelLabel="Mantener inscripción"
        confirmLabel={
          submitting
            ? "Cancelando..."
            : error
              ? "Reintentar"
              : "Cancelar inscripción"
        }
        confirming={submitting}
        onCancel={() => {
          if (!inFlight.current) {
            setOpen(false);
            setError(null);
          }
        }}
        onConfirm={() => void confirm()}
      >
        {!error ? <div className="hu4-cancellation-event">
          <strong>{event.title}</strong>
          <p className="hu4-cancellation-event-meta">
            <span>{formatEventSchedule(event.startDate, event.endDate)}</span>
            {" · "}
            <span>{event.location || "Ubicación por definir"}</span>
          </p>
          <p className="hu4-cancellation-event-warning">
            El pase QR asociado dejará de estar vigente y se conservará la trazabilidad.
          </p>
        </div> : null}
        {submitting ? (
          <p className="hu4-cancellation-note" role="status">
            Procesando cancelación...
          </p>
        ) : null}
        {expired ? (
          <p className="hu4-cancellation-error" role="alert">
            El evento ha finalizado. No se enviará la cancelación.
          </p>
        ) : null}
      </ConfirmModal>
    </div>
  );
}
