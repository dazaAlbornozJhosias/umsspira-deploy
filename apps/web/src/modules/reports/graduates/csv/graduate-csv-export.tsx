'use client';

import { ChevronDown, Download, FileText, LoaderCircle, X } from 'lucide-react';
import { useState } from 'react';
import {
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
}

type Feedback =
  | { type: 'error'; text: string }
  | { type: 'success'; text: string }
  | null;

function getStatusText(status: GraduateCsvStatus): string {
  if (status === 'VERIFICADO') return 'verificados';
  if (status === 'OBSERVADO') return 'observados';
  return '';
}

function getEmptyMessage(status: GraduateCsvStatus): string {
  if (status === 'VERIFICADO') {
    return 'No hay titulados verificados para exportar';
  }

  if (status === 'OBSERVADO') {
    return 'No hay titulados observados para exportar';
  }

  return 'No hay titulados para exportar';
}

export function GraduateCsvExport({
  totalRecords,
  filters = {},
  apiBaseUrl,
  onPdfExport,
}: GraduateCsvExportProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const status = filters.status ?? 'TODOS';
  const statusText = getStatusText(status);
  const recordsDescription = statusText
    ? `${totalRecords} titulados ${statusText}`
    : `${totalRecords} titulados`;

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
    setFeedback(null);

    try {
      const file = await requestGraduateCsv(filters, apiBaseUrl);
      triggerGraduateCsvDownload(file);
      setConfirmOpen(false);
      setFeedback({
        type: 'success',
        text: 'La nómina CSV fue generada correctamente.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el archivo CSV. Intente nuevamente.',
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
        disabled={isGenerating}
        onClick={() => {
          setMenuOpen((current) => !current);
          setFeedback(null);
        }}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2C3B4D] px-5 py-3 font-semibold text-[#EEE9DF] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? (
          <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : (
          <Download aria-hidden="true" className="h-5 w-5" />
        )}
        {isGenerating ? 'Generando...' : 'Exportar'}
        {!isGenerating && (
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        )}
      </button>

      {menuOpen && !isGenerating && (
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
                  : 'Se habilitará al integrar HU4'}
              </span>
            </span>
          </button>
        </div>
      )}

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-[#A35139] text-[#A35139]'
              : 'border-[#2C3B4D] text-[#2C3B4D]'
          }`}
        >
          {feedback.text}
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
              <div>
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
                {isGenerating ? 'Generando...' : 'Descargar CSV'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
