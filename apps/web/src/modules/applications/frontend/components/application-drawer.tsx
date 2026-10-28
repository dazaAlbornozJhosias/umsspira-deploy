"use client";

import { useEffect, useState } from "react";
import {
  ApplicationDetail,
  OVERDUE_HOURS,
  STATUS_LABEL,
  hoursSince,
  type Application,
} from "./application-detail";
import {
  fetchApplicationDetail,
  fetchDocumentUrl,
} from "../services/applications-board.service";
import { ApproveDialog } from "./approve-dialog";
import { ObserveDialog } from "./observe-dialog";
import { RejectDialog } from "./reject-dialog";
import { btnAccent, btnDanger, btnSecondary } from "./review-ui";

type Props = {
  open: boolean;
  applicationId: string | null;
  onClose: () => void;
  onReviewed?: () => void; // para refrescar la tabla después del dictamen
};

type ActiveDialog = "approve" | "observe" | "reject" | null;

export function ApplicationDrawer({
  open,
  applicationId,
  onClose,
  onReviewed,
}: Props) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // CA-04.3: trae el expediente real y la URL firmada del documento (5 min).
  useEffect(() => {
    if (!open || !applicationId) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setApplication(null);
    (async () => {
      const detail = await fetchApplicationDetail(applicationId);
      if (cancelled) return;
      if (!detail.ok) {
        setLoadError(detail.message);
        setIsLoading(false);
        return;
      }
      const doc = await fetchDocumentUrl(applicationId);
      if (cancelled) return;
      const data = detail.data;
      setApplication({
        id: data.id,
        code: data.code,
        status: data.status,
        firstName: data.firstName,
        lastName: data.lastName,
        ci: [data.ci, data.issuedIn].filter(Boolean).join(" "),
        segipValidated: false,
        institutionalEmail: data.email,
        phone: data.phone,
        sisCode: data.sisCode,
        career: data.career,
        graduationYear: data.graduationYear ? `Gestión ${data.graduationYear}` : "",
        submittedAt: data.submittedAt,
        procedureType: data.documentFormat ? `Documento ${data.documentFormat}` : "Documento de respaldo",
        procedureMode: "Original",
        documentName: data.documentName || "documento",
        documentUrl: doc.ok ? doc.data.url : "",
        documentFormat: data.documentFormat,
        checklist: [{ label: "Expediente recibido en la bandeja", checked: true }],
      });
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, applicationId]);

  if (!open || !applicationId) return null;

  const canReview = application?.status === "PENDIENTE" || (application?.status as string)?.toUpperCase() === "PENDING"; 
  const overdue = application ? hoursSince(application.submittedAt) > OVERDUE_HOURS : false;
  const applicantName = application ? `${application.firstName} ${application.lastName}` : "";

  function handleReviewed() {
    setActiveDialog(null);
    onReviewed?.();
    onClose();
  }

  // Props comunes de los tres modales de dictamen
  const dialogProps = {
    applicationId: application?.id ?? applicationId,
    expedienteCode: application?.code ?? "",
    applicantName,
    onClose: () => setActiveDialog(null),
    onSuccess: handleReviewed,
  };

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 top-[70px] z-40 bg-[#1B2632]/40 min-[601px]:top-[76px] min-[1261px]:top-[84px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed bottom-0 right-0 top-[70px] z-40 flex min-h-0 w-full max-w-6xl flex-col overflow-hidden bg-[#EEE9DF] shadow-xl min-[601px]:top-[76px] min-[1261px]:top-[84px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Encabezado */}
        <header className="shrink-0 flex items-start justify-between gap-4 border-b border-[#C9C1B1] bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={onClose}
              className="text-[14px] font-semibold text-[#A35139]"
            >
              ← Volver a la bandeja
            </button>
            <h2
              id="drawer-title"
              className="text-[24px] font-semibold leading-8 text-[#1B2632]"
            >
              EXPEDIENTE: {application?.code ?? "…"}
            </h2>
            <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium leading-5 text-[#2C3B4D]">
              Revisión de grado y título
              {application && (
                <span className="rounded-full border border-[#C9C1B1] bg-[#EEE9DF] px-3 py-0.5 text-[12px] font-semibold text-[#1B2632]">
                  {STATUS_LABEL[application.status]}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded px-2 text-[24px] leading-none text-[#2C3B4D] hover:bg-[#EEE9DF]"
          >
            ×
          </button>
        </header>

        {/* Contenido con scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {isLoading && (
            <p className="py-10 text-center text-sm text-[#2C3B4D]">Cargando expediente…</p>
          )}
          {loadError && !isLoading && (
            <p role="alert" className="rounded-lg border border-[#A35139]/40 bg-[#A35139]/10 p-3 text-sm font-medium text-[#A35139]">
              {loadError}
            </p>
          )}
          {application && !isLoading && <ApplicationDetail application={application} />}
        </div>

        {/* Barra inferior: ID, prioridad y acciones */}
        <footer className="shrink-0 flex flex-col items-stretch justify-between gap-3 border-t border-[#C9C1B1] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
          <p className="text-[13px] font-medium leading-5 text-[#2C3B4D]">
            Expediente ID:{" "}
            <strong className="text-[#1B2632]">#{application?.code ?? "…"}</strong>
            {overdue && (
              <span className="ml-2 font-semibold text-[#A35139]">
                • Prioridad: Urgente (&gt;{OVERDUE_HOURS}h)
              </span>
            )}
          </p>

          {canReview && (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3">
              <button
                type="button"
                onClick={() => setActiveDialog("reject")}
                className={btnDanger}
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => setActiveDialog("observe")}
                className={btnSecondary}
              >
                Observar
              </button>
              <button
                type="button"
                onClick={() => setActiveDialog("approve")}
                className={btnAccent}
              >
                Aprobar
              </button>
            </div>
          )}
        </footer>
      </aside>

      <ApproveDialog open={activeDialog === "approve"} {...dialogProps} />
      <ObserveDialog open={activeDialog === "observe"} {...dialogProps} />
      <RejectDialog open={activeDialog === "reject"} {...dialogProps} />
    </>
  );
}
