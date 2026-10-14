'use client';

import '../lib/pdf-worker';
import { ChevronLeft, ChevronRight, Download, Printer, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { cn } from '@/shared/utils/cn';
import { REPORT_MESSAGES } from '../constants/report-messages';
import { useModalFocus } from '../hooks/use-modal-focus';
import { downloadPdf } from '../utils/download-pdf';
import { disposePrintFrame, printPdf } from '../utils/print-pdf';
import { PreviewErrorBoundary } from './preview-error-boundary';

export interface PdfPreviewModalProps {
  file: Blob;
  fileName: string;
  onClose: () => void;
  // Avisa que la vista previa terminó de cargar (quita el «Generando…» del botón Exportar)
  onLoaded: () => void;
}

const PAGE_RATIO = 595 / 842; // alto / ancho de una hoja A4 horizontal

const buttonBase =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3B4D]';
const buttonSecondary = `${buttonBase} border border-[#C9C1B1] bg-white text-[#1B2632] hover:border-[#2C3B4D]`;
const buttonPrimary = `${buttonBase} bg-[#FFB162] text-[#1B2632] hover:brightness-95`;
const areaMessage = 'max-w-sm px-6 text-center text-sm text-[#1B2632]';

// Vista previa del PDF antes de descargarlo (mock-ups 3, 4 y 5).
// Modal en computadora; pantalla completa en celular, con Imprimir y Descargar abajo.
export function PdfPreviewModal({ file, fileName, onClose, onLoaded }: PdfPreviewModalProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [area, setArea] = useState({ width: 0, height: 0 });
  // El visor no pudo mostrar el PDF: la ventana sigue abierta para descargarlo o imprimirlo
  const [isViewerUnavailable, setIsViewerUnavailable] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModalFocus(dialogRef, closeRef);

  // Ajusta la hoja al espacio disponible (ancho y alto)
  useEffect(() => {
    const element = areaRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setArea({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Esc cierra la vista previa
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Mientras está abierta, la página de atrás no se desplaza; al cerrar se libera la impresión
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      disposePrintFrame();
    };
  }, []);

  const handleViewerError = useCallback(() => {
    setIsViewerUnavailable(true);
    onLoaded();
  }, [onLoaded]);

  const pageWidth = Math.max(
    0,
    Math.floor(Math.min(area.width - 32, (area.height - 32) / PAGE_RATIO)),
  );
  const isFirstPage = page <= 1;
  const isLastPage = page >= numPages;

  const paginator = !isViewerUnavailable && (
    <div role="group" aria-label="Páginas del reporte" className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setPage((current) => current - 1)}
        disabled={isFirstPage}
        aria-label="Página anterior"
        className={cn(buttonSecondary, 'w-10 px-0 disabled:cursor-not-allowed disabled:opacity-40')}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <span
        aria-live="polite"
        className="min-w-[4.5rem] rounded-lg bg-[#EEE9DF] px-3 py-2 text-center text-sm font-semibold text-[#1B2632]"
      >
        {numPages ? `${page} / ${numPages}` : '…'}
      </span>
      <button
        type="button"
        onClick={() => setPage((current) => current + 1)}
        disabled={isLastPage}
        aria-label="Página siguiente"
        className={cn(buttonSecondary, 'w-10 px-0 disabled:cursor-not-allowed disabled:opacity-40')}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );

  const printButton = (
    <button type="button" onClick={() => printPdf(file)} className={buttonSecondary}>
      <Printer className="h-4 w-4" aria-hidden="true" />
      Imprimir
    </button>
  );
  const downloadButton = (
    <button type="button" onClick={() => downloadPdf(file, fileName)} className={buttonPrimary}>
      <Download className="h-4 w-4" aria-hidden="true" />
      Descargar
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2632]/45 md:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-preview-title"
        className="flex h-full w-full flex-col bg-white md:h-[min(744px,92vh)] md:max-w-[1180px] md:rounded-2xl md:shadow-xl"
      >
        <header className="flex items-center gap-4 border-b border-[#C9C1B1] px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            <h2 id="pdf-preview-title" className="text-lg font-semibold text-[#1B2632]">
              Vista previa
            </h2>
            <p className="truncate text-xs text-[#2C3B4D]/75">{fileName}</p>
          </div>
          <div className="hidden md:block">{paginator}</div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="hidden items-center gap-2 md:flex">
              {printButton}
              {downloadButton}
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className={buttonSecondary}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cerrar
            </button>
          </div>
        </header>

        <div ref={areaRef} className="flex flex-1 items-center justify-center overflow-auto bg-[#C9C1B1]/55 md:m-3 md:rounded-xl">
          {isViewerUnavailable ? (
            <p role="status" className={cn(areaMessage, 'font-semibold')}>
              {REPORT_MESSAGES.previewUnavailable}
            </p>
          ) : (
            <PreviewErrorBoundary onError={handleViewerError}>
              <Document
                file={file}
                onLoadSuccess={({ numPages: total }) => {
                  setNumPages(total);
                  setPage(1);
                  onLoaded();
                }}
                onLoadError={handleViewerError}
                loading={<p className={areaMessage}>{REPORT_MESSAGES.previewLoading}</p>}
                error={<p className={areaMessage}>{REPORT_MESSAGES.previewUnavailable}</p>}
              >
                {pageWidth > 0 && (
                  <Page
                    pageNumber={page}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onRenderError={handleViewerError}
                    className="shadow-md"
                  />
                )}
              </Document>
            </PreviewErrorBoundary>
          )}
        </div>

        <footer className="flex flex-col items-center gap-3 border-t border-[#C9C1B1] px-4 pb-6 pt-3 landscape:flex-row landscape:justify-between landscape:pb-3 md:hidden">
          {paginator}
          <div className="grid w-full grid-cols-2 gap-3 landscape:w-auto">
            {printButton}
            {downloadButton}
          </div>
        </footer>
      </div>
    </div>
  );
}
