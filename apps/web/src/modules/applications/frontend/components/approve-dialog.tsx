"use client";

import { useReview } from "../hooks/use-review";
import { btnAccent, btnSecondary, InfoBox, FieldError, ModalShell } from "./review-ui";

type Props = {
  open: boolean;
  applicationId: string;
  expedienteCode: string;
  applicantName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ApproveDialog({
  open,
  applicationId,
  expedienteCode,
  applicantName,
  onClose,
  onSuccess,
}: Props) {
  const { submitReview, isLoading, error } = useReview({
    applicationId,
    onSuccess,
  });

  if (!open) return null;

  async function handleConfirm() {
    const ok = await submitReview({ decision: "APROBADA" });
    if (ok) onClose();
  }

  return (
    <ModalShell
      titleId="approve-title"
      title="Aprobar Expediente"
      subtitle={`ID: #${expedienteCode}`}
      onClose={onClose}
    >
      <InfoBox>
        Expediente: <strong>#{expedienteCode}</strong> • {applicantName}. Al
        aprobar, se generará el código de activación (válido por 24 horas) y se
        notificará al titulado por correo.
      </InfoBox>

      {error && <FieldError>{error}</FieldError>}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
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
          {isLoading ? "Aprobando..." : "Confirmar Aprobación"}
        </button>
      </div>
    </ModalShell>
  );
}