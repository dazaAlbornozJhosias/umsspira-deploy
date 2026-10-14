"use client";

import { useState } from "react";
import {
  MAX_NOTE_LENGTH,
  MIN_NOTE_LENGTH,
  REJECTION_CAUSES,
  useReview,
} from "../hooks/use-review";
import {
  btnDanger,
  btnSecondary,
  CheckboxRow,
  FieldError,
  FieldHint,
  FieldLabel,
  fieldClass,
  InfoBox,
  ModalShell,
} from "./review-ui";

type Props = {
  open: boolean;
  applicationId: string;
  expedienteCode: string;
  applicantName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function RejectDialog({
  open,
  applicationId,
  expedienteCode,
  applicantName,
  onClose,
  onSuccess,
}: Props) {
  const [cause, setCause] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const { submitReview, isLoading, error } = useReview({
    applicationId,
    onSuccess,
  });

  if (!open) return null;

  const length = note.trim().length;
  const causeInvalid = cause === "";
  const noteInvalid = length < MIN_NOTE_LENGTH;
  const confirmInvalid = !confirmed;

  const showCauseError = attempted && causeInvalid;
  const showNoteError = attempted && noteInvalid;
  const showConfirmError = attempted && confirmInvalid;

  function handleClose() {
    setCause("");
    setNote("");
    setConfirmed(false);
    setAttempted(false);
    onClose();
  }

  async function handleConfirm() {
    setAttempted(true);
    // CA-04.6: bloquea el envío si falta algo
    if (causeInvalid || noteInvalid || confirmInvalid) return;

    const ok = await submitReview({
      decision: "REJECTED",
      category: cause,
      note: note.trim(),
    });
    if (ok) handleClose();
  }

  return (
    <ModalShell
      titleId="reject-title"
      title="Rechazar Expediente"
      subtitle={`ID: #${expedienteCode} • Mesa de Control`}
      onClose={handleClose}
    >
      <p className="text-[14px] leading-5 text-[#1B2632]">
        Expediente: <strong>#{expedienteCode}</strong> • {applicantName}. Esta
        resolución cancelará definitivamente el trámite actual y notificará a
        las instancias universitarias pertinentes.
      </p>

      <InfoBox tone="danger">
        ⚠ Esta acción no se puede deshacer. El solicitante no podrá crear
        cuenta ni proseguir con este expediente bajo la normativa vigente.
      </InfoBox>

      {/* Causal */}
      <div>
        <FieldLabel htmlFor="reject-cause" required>
          Causal de rechazo definitivo
        </FieldLabel>
        <select
          id="reject-cause"
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          disabled={isLoading}
          aria-invalid={showCauseError}
          className={fieldClass(showCauseError)}
        >
          <option value="">Seleccione la causal dictaminada...</option>
          {REJECTION_CAUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {showCauseError && <FieldError>Este campo es obligatorio.</FieldError>}
      </div>

      {/* Justificación */}
      <div>
        <FieldLabel htmlFor="reject-note" required>
          Justificación del rechazo
        </FieldLabel>
        <textarea
          id="reject-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          maxLength={MAX_NOTE_LENGTH}
          disabled={isLoading}
          aria-invalid={showNoteError}
          placeholder="Redacte el dictamen fundamentado de rechazo conforme al Reglamento..."
          className={fieldClass(showNoteError)}
        />
        <div className="flex items-start justify-between gap-2">
          {showNoteError ? (
            <FieldError>
              {length === 0
                ? "Este campo es obligatorio."
                : `La justificación debe tener al menos ${MIN_NOTE_LENGTH} caracteres.`}
            </FieldError>
          ) : (
            <FieldHint>Mínimo {MIN_NOTE_LENGTH} caracteres requeridos.</FieldHint>
          )}
          <span className="mt-1 shrink-0 text-[11px] font-medium text-[#2C3B4D]">
            {note.length}/{MAX_NOTE_LENGTH}
          </span>
        </div>
      </div>

      {/* Confirmación */}
      <div>
        <CheckboxRow
          id="reject-confirm"
          checked={confirmed}
          onChange={setConfirmed}
          disabled={isLoading}
          invalid={showConfirmError}
        >
          Confirmo que he cotejado los antecedentes en el SIA antes de emitir
          este dictamen vinculante e irrevocable.
        </CheckboxRow>
        {showConfirmError && (
          <FieldError>Debes confirmar antes de rechazar.</FieldError>
        )}
      </div>

      {error && <FieldError>{error}</FieldError>}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className={btnSecondary}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={btnDanger}
        >
          {isLoading ? "Rechazando..." : "Confirmar Rechazo"}
        </button>
      </div>
    </ModalShell>
  );
}