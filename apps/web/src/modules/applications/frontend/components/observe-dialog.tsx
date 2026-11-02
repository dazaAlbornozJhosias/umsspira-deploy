"use client";

import { useState } from "react";
import {
  MAX_NOTE_LENGTH,
  MIN_NOTE_LENGTH,
  OBSERVATION_CATEGORIES,
  useReview,
} from "../hooks/use-review";
import {
  btnAccent,
  btnSecondary,
  
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

export function ObserveDialog({
  open,
  applicationId,
  expedienteCode,
  applicantName,
  onClose,
  onSuccess,
}: Props) {
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  
  const [attempted, setAttempted] = useState(false);

  const { submitReview, isLoading, error } = useReview({
    applicationId,
    onSuccess,
  });

  if (!open) return null;

  const length = note.trim().length;
  const categoryInvalid = category === "";
  const noteInvalid = length < MIN_NOTE_LENGTH;

  const showCategoryError = attempted && categoryInvalid;
  const showNoteError = attempted && noteInvalid;

  function handleClose() {
    setCategory("");
    setNote("");
    
    setAttempted(false);
    onClose();
  }

  async function handleConfirm() {
    setAttempted(true);
    // CA-04.6: bloquea el envío si falta la categoría o la nota es corta
    if (categoryInvalid || noteInvalid) return;

    const ok = await submitReview({
      decision: "OBSERVADA",
      category,
      note: note.trim(),
      
    });
    if (ok) handleClose();
  }

  return (
    <ModalShell
      titleId="observe-title"
      title="Observar Expediente"
      badge="Dictamen administrativo"
      onClose={handleClose}
    >
      <InfoBox>
        Expediente: <strong>#{expedienteCode}</strong> • {applicantName}.
        Indique los motivos formales para requerir subsanación al postulante en
        el sistema UMSSPIRA.
      </InfoBox>

      {/* Categoría */}
      <div>
        <FieldLabel htmlFor="observe-category" required>
          Categoría de la observación
        </FieldLabel>
        <select
          id="observe-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isLoading}
          aria-invalid={showCategoryError}
          className={fieldClass(showCategoryError)}
        >
          <option value="">Seleccione un ámbito de observación...</option>
          {OBSERVATION_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {showCategoryError && (
          <FieldError>Este campo es obligatorio.</FieldError>
        )}
      </div>

      {/* Nota */}
      <div>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="observe-note" required>
            Nota de observación
          </FieldLabel>
          <span className="mb-1.5 text-[11px] font-medium text-[#2C3B4D]">
            {note.length} / {MAX_NOTE_LENGTH}
          </span>
        </div>
        <textarea
          id="observe-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          maxLength={MAX_NOTE_LENGTH}
          disabled={isLoading}
          aria-invalid={showNoteError}
          placeholder="Explique qué debe corregir el titulado..."
          className={fieldClass(showNoteError)}
        />
        {showNoteError ? (
          <FieldError>
            {length === 0
              ? "Este campo es obligatorio."
              : `La nota debe tener al menos ${MIN_NOTE_LENGTH} caracteres.`}
          </FieldError>
        ) : (
          <FieldHint>Mínimo {MIN_NOTE_LENGTH} caracteres requeridos.</FieldHint>
        )}
      </div>

      {/* Notificación */}
            {/* Aviso de notificación automática (CA-09.1 / CA-10.1) */}
      <p className="rounded-md bg-[#F0F4F8] p-3 text-[12px] leading-relaxed text-[#2C3B4D]">
        ℹ Al confirmar la observación, el sistema notificará automáticamente al titulado por correo electrónico con las observaciones detalladas y su enlace seguro de subsanación.
      </p>
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
          className={btnAccent}
        >
          {isLoading ? "Enviando..." : "Confirmar Observación"}
        </button>
      </div>
    </ModalShell>
  );
}