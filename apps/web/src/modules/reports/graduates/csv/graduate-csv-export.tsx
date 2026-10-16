'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  LoaderCircle,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  buildGraduateCsvFilename,
  GRADUATE_CSV_ERROR_MESSAGE,
  GraduateCsvFilters,
  GraduateCsvStatus,
  requestGraduateCsv,
  triggerGraduateCsvDownload,
} from './graduate-csv.client';

interface GraduateCsvExportProps {
  totalRecords: number;
  filters?: GraduateCsvFilters;
  apiBaseUrl?: string;
  onPdfExport?: () => void;
  // El PDF (HU4) se está generando: el botón Exportar muestra «Generando...» y queda deshabilitado
  isPdfGenerating?: boolean;
}

type Feedback =
  | { type: 'error'; text: string; filename?: never }
  | { type: 'success'; text: string; filename: string }
  | null;

const INITIAL_PROGRESS_VISIBLE_MS = 120;
const COMPLETED_PROGRESS_VISIBLE_MS = 380;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getStatusText(status: GraduateCsvStatus): string {
  if (status === 'VERIFICADO') return 'verificados';
  if (status === 'OBSERVADO') return 'observados';
  return '';
}

function getEmptyMessage(status: GraduateCsvStatus): string {
  if (status === 'VERIFICADO') {
    return 'No hay egresados verificados para exportar';
  }

  if (status === 'OBSERVADO') {
    return 'No hay egresados observados para exportar';
  }

  return 'No hay egresados para exportar';
}

export function GraduateCsvExport({
  totalRecords,
  filters = {},
  apiBaseUrl,
  onPdfExport,
  isPdfGenerating = false,
}: GraduateCsvExportProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const isBusy = isGenerating || isPdfGenerating;

  const status = filters.status ?? 'TODOS';
  const statusText = getStatusText(status);
  const recordsDescription = statusText
    ? `${totalRecords} titulados ${statusText}`
    : `${totalRecords} titulados`;
  const previewFilename = buildGraduateCsvFilename(status);

  const handleCsvSelection = () => {
    setMenuOpen(false);
    setFeedback(null);

    if (totalRecords <= 0) {
      setFeedback({
        type: 'error',
        text: getEmptyMessage(status),
      });
      return;
    }

    setProgress(0);
    setConfirmOpen(true);
  };

  const handlePdfSelection = () => {
    if (!onPdfExport) {
      return;
    }

    setMenuOpen(false);
    setFeedback(null);
    onPdfExport();
  };

  const handleCsvConfirmation = async () => {
    setIsGenerating(true);
    setProgress(0);
    setFeedback(null);

    try {
      // El CSV suele pesar pocos KB. Dejamos visible el estado inicial el
      // tiempo suficiente para que el navegador pinte la barra antes de
      // comenzar la petición y así cumplir el criterio visual de QA.
      await delay(INITIAL_PROGRESS_VISIBLE_MS);

      const file = await requestGraduateCsv(
        filters,
        apiBaseUrl,
        setProgress,
      );

      triggerGraduateCsvDownload(file);
      setProgress(100);

      // Si la respuesta llega en un único chunk, 0% -> 100% puede ocurrir en
      // milisegundos. Conservamos brevemente el 100% para que el usuario vea
      // el porcentaje y la barra completada antes de cerrar el modal.
      await delay(COMPLETED_PROGRESS_VISIBLE_MS);

      setConfirmOpen(false);
      setFeedback({
        type: 'success',
        text: 'Archivo CSV descargado',
        filename: file.filename,
      });
    } catch (error) {
      const controlledMessage =
        error instanceof Error &&
        error.message.startsWith('No hay egresados')
          ? error.message
          : GRADUATE_CSV_ERROR_MESSAGE;

      setFeedback({
        type: 'error',
        text: controlledMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="relative w-full max-w-md text-[#1B2632]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        disabled={isBusy}
        onClick={() => {
          setMenuOpen((current) => !current);
          setFeedback(null);
        }}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2C3B4D] px-5 py-3 font-semibold text-[#EEE9DF] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPdfGenerating ? (
          <>
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Download aria-hidden="true" className="h-5 w-5" />
            Exportar
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </>
        )}
      </button>

      {menuOpen && !isBusy && (
        <div
          role="menu"
          aria-label="Formatos de exportación"
          className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-lg border border-[#C9C1B1] bg-[#EEE9DF] shadow-lg"
        >
          <div className="border-b border-[#C9C1B1] px-4 py-3">
            <p className="font-semibold text-[#1B2632]">
              Formato de exportación
            </p>
            <p className="mt-1 text-sm text-[#2C3B4D]">
              {recordsDescription} serán exportados.
            </p>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={handleCsvSelection}
            className="flex w-full items-center gap-3 border-b border-[#C9C1B1] px-4 py-3 text-left hover:bg-[#C9C1B1] focus:bg-[#C9C1B1] focus:outline-none"
          >
            <FileText aria-hidden="true" className="h-5 w-5" />
            <span>
              <span className="block font-semibold">CSV</span>
              <span className="block text-sm text-[#2C3B4D]">
                Nómina compatible con Excel
              </span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={!onPdfExport}
            onClick={handlePdfSelection}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#C9C1B1] focus:bg-[#C9C1B1] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText aria-hidden="true" className="h-5 w-5" />
            <span>
              <span className="block font-semibold">PDF</span>
              <span className="block text-sm text-[#2C3B4D]">
                {onPdfExport
                  ? 'Reporte institucional'
                  : 'Seleccione Verificados u Observados'}
              </span>
            </span>
          </button>
        </div>
      )}

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`fixed right-4 top-4 z-[70] w-[calc(100%-2rem)] max-w-sm rounded-xl border p-4 shadow-xl sm:right-6 sm:top-6 ${
            feedback.type === 'error'
              ? 'border-[#A35139] bg-[#FFF4F0]'
              : 'border-[#2C3B4D] bg-white'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'error' ? (
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-[#A35139]"
              />
            ) : (
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-[#2C3B4D]"
              />
            )}

            <div className="min-w-0 flex-1">
              <p
                className={`font-semibold ${
                  feedback.type === 'error'
                    ? 'text-[#A35139]'
                    : 'text-[#1B2632]'
                }`}
              >
                {feedback.text}
              </p>
              {feedback.type === 'success' ? (
                <p className="mt-1 break-all text-sm text-[#2C3B4D]">
                  {feedback.filename}
                </p>
              ) : (
                <p className="mt-1 text-sm text-[#2C3B4D]">
                  No se descargó ningún archivo.
                </p>
              )}
            </div>

            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={() => setFeedback(null)}
              className="rounded-md p-1 text-[#2C3B4D] hover:bg-[#EEE9DF]"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2632]/40 p-4"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="csv-confirmation-title"
            className="w-full max-w-lg rounded-xl border border-[#C9C1B1] bg-[#EEE9DF] p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2
                  id="csv-confirmation-title"
                  className="text-2xl font-semibold text-[#1B2632]"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  Exportar nómina en CSV
                </h2>
                <p className="mt-2 text-[#2C3B4D]">
                  Se exportarán {recordsDescription} con los filtros activos.
                </p>

                <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#C9C1B1] bg-white px-4 py-3">
                  <FileText
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-[#2C3B4D]"
                  />
                  <span className="min-w-0 break-all text-sm font-semibold text-[#1B2632]">
                    {previewFilename}
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Cerrar confirmación"
                disabled={isGenerating}
                onClick={() => setConfirmOpen(false)}
                className="rounded-md p-1 text-[#1B2632] hover:bg-[#C9C1B1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            {isGenerating && (
              <div
                className="mt-5 rounded-lg border border-[#C9C1B1] bg-white px-4 py-3"
                role="status"
                aria-live="polite"
              >
                <div className="mb-2 flex items-center justify-between gap-4 text-sm font-semibold text-[#1B2632]">
                  <span>Descargando archivo...</span>
                  <span>{progress}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Progreso de descarga CSV"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  className="h-2 overflow-hidden rounded-full bg-[#C9C1B1]"
                >
                  <div
                    className="h-full rounded-full bg-[#FFB162] transition-[width] duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => setConfirmOpen(false)}
                className="min-h-11 rounded-lg border border-[#2C3B4D] px-5 py-2 font-semibold text-[#2C3B4D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleCsvConfirmation}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#FFB162] px-5 py-2 font-semibold text-[#1B2632] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating && (
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin"
                  />
                )}
                Confirmar .csv
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
