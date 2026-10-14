'use client';

import dynamic from 'next/dynamic';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { usePdfExport } from '../hooks/use-pdf-export';
import { GraduateStatus } from '../types/graduates-report.types';
import { ExportMenu } from './export-menu';
import { PreviewErrorBoundary } from './preview-error-boundary';
import { ReportAlertModal } from './report-alert-modal';

// react-pdf sólo funciona en el navegador: la vista previa no se arma en el servidor
const PdfPreviewModal = dynamic(
  () => import('./pdf-preview-modal').then((module) => module.PdfPreviewModal),
  { ssr: false },
);

// Lo que recibe un botón externo para iniciar la exportación
export interface ExportTriggerControls {
  exportPdf: (status: GraduateStatus) => void;
  isGenerating: boolean;
}

export interface GraduatesReportExportProps {
  // Estado elegido en el filtro de la lista (HU2). Si no se indica, el menú
  // ofrece «PDF de verificados» y «PDF de observados».
  status?: GraduateStatus;
  // Temporal hasta que exista el login: carrera del administrador (Sistemas o Informática).
  // Con login, la API la toma del token y esta propiedad deja de usarse.
  careerId?: string;
  // Al cerrar la vista previa la lista vuelve a su inicio (página 1); lo resuelve la pantalla
  onBackToListStart?: () => void;
  // Reemplaza el botón Exportar propio por otro (por ejemplo, el menú de exportación de la HU5,
  // que ya tiene la opción PDF). La vista previa y las alertas siguen a cargo de este componente.
  renderTrigger?: (controls: ExportTriggerControls) => ReactNode;
}

// Exportación del reporte de titulados a PDF (HU4): botón, «Generando…», vista previa y alertas.
// Se coloca en la pantalla de titulados, en el espacio de las acciones de exportación.
export function GraduatesReportExport({
  status,
  careerId,
  onBackToListStart,
  renderTrigger,
}: GraduatesReportExportProps) {
  const {
    state,
    report,
    isGenerating,
    alertMessage,
    startExport,
    cancelExport,
    markPreviewLoaded,
    closeAlert,
    closePreview,
    failPreview,
  } = usePdfExport();
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const hadWindowOpenRef = useRef(false);

  const handleExportPdf = useCallback(
    (selectedStatus: GraduateStatus) => {
      if (isGenerating) return;
      startExport(selectedStatus, careerId);
    },
    [isGenerating, startExport, careerId],
  );

  const handleClosePreview = useCallback(() => {
    closePreview();
    window.scrollTo({ top: 0 });
    onBackToListStart?.();
  }, [closePreview, onBackToListStart]);

  // Si cambia el filtro o la carrera mientras se genera, ese PDF ya no corresponde a la lista
  useEffect(() => cancelExport, [status, careerId, cancelExport]);

  // Al cerrar la vista previa o la alerta, el foco vuelve al botón Exportar
  useEffect(() => {
    if (hadWindowOpenRef.current && state === 'idle') exportButtonRef.current?.focus();
    hadWindowOpenRef.current = state === 'preview' || state === 'empty' || state === 'error';
  }, [state]);

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ exportPdf: handleExportPdf, isGenerating })
      ) : (
        <ExportMenu
          status={status}
          isGenerating={isGenerating}
          onExportPdf={handleExportPdf}
          buttonRef={exportButtonRef}
        />
      )}
      {state === 'preview' && report && (
        <PreviewErrorBoundary onError={failPreview}>
          <PdfPreviewModal
            file={report.file}
            fileName={report.fileName}
            onClose={handleClosePreview}
            onLoaded={markPreviewLoaded}
          />
        </PreviewErrorBoundary>
      )}
      {(state === 'empty' || state === 'error') && (
        <ReportAlertModal message={alertMessage} onClose={closeAlert} />
      )}
    </>
  );
}
