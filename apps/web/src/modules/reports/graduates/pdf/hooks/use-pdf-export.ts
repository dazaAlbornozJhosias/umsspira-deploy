'use client';

import { useCallback, useRef, useState } from 'react';
import { EXPORT_TIMEOUT_MS, REPORT_MESSAGES } from '../constants/report-messages';
import { EmptyReportException, fetchGraduatesReportPdf } from '../services/graduates-report-service';
import { ExportState, GraduateStatus, ReportPdfFile } from '../types/graduates-report.types';

// Maneja la exportación a PDF: pedir el archivo, «Generando…», vista previa y alertas.
// El botón sigue en «Generando…» hasta que la vista previa termina de cargar (criterio de QA).
export function usePdfExport() {
  const [state, setState] = useState<ExportState>('idle');
  const [report, setReport] = useState<ReportPdfFile | null>(null);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  // Pedido en curso: permite cancelarlo y descartar una respuesta que ya no corresponde
  const pendingRef = useRef<AbortController | null>(null);

  const startExport = useCallback(async (status: GraduateStatus, careerId?: string) => {
    pendingRef.current?.abort();
    const controller = new AbortController();
    pendingRef.current = controller;
    // Si la API no responde, se corta el pedido y se muestra el aviso de falla
    const timeout = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);

    setState('generating');
    setReport(null);
    setIsPreviewLoaded(false);
    try {
      const pdf = await fetchGraduatesReportPdf(status, careerId, controller.signal);
      if (pendingRef.current !== controller) return;
      setReport(pdf);
      setState('preview');
    } catch (error) {
      if (pendingRef.current !== controller) return;
      if (error instanceof EmptyReportException) {
        setAlertMessage(error.message);
        setState('empty');
      } else {
        setAlertMessage(REPORT_MESSAGES.generationError);
        setState('error');
      }
    } finally {
      clearTimeout(timeout);
      if (pendingRef.current === controller) pendingRef.current = null;
    }
  }, []);

  // Cancela el pedido en curso sin mostrar alerta: cambió el filtro de la lista o se dejó la pantalla
  const cancelExport = useCallback(() => {
    if (!pendingRef.current) return;
    pendingRef.current.abort();
    pendingRef.current = null;
    setState('idle');
  }, []);

  // La vista previa avisa cuando ya se ve el PDF
  const markPreviewLoaded = useCallback(() => setIsPreviewLoaded(true), []);

  const closeAlert = useCallback(() => {
    setAlertMessage('');
    setState('idle');
  }, []);

  const closePreview = useCallback(() => {
    setReport(null);
    setIsPreviewLoaded(false);
    setState('idle');
  }, []);

  // La ventana de la vista previa no se pudo abrir: mismo aviso que una falla al generar
  const failPreview = useCallback(() => {
    setReport(null);
    setIsPreviewLoaded(false);
    setAlertMessage(REPORT_MESSAGES.generationError);
    setState('error');
  }, []);

  const isGenerating = state === 'generating' || (state === 'preview' && !isPreviewLoaded);

  return {
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
  };
}
