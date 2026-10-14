'use client';

import { Check } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { REPORT_MESSAGES } from '../constants/report-messages';
import { useModalFocus } from '../hooks/use-modal-focus';

export interface ReportAlertModalProps {
  message: string;
  onClose: () => void;
}

// Aviso de la exportación: «No hay titulados … para exportar» o «No se pudo generar el reporte PDF…».
// Mock-ups 6 y 7 de escritorio y celular.
export function ReportAlertModal({ message, onClose }: ReportAlertModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const understoodRef = useRef<HTMLButtonElement>(null);

  useModalFocus(dialogRef, understoodRef);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2632]/45 px-6">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={REPORT_MESSAGES.alertTitle}
        aria-describedby="report-alert-message"
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#A35139] text-2xl font-bold text-white"
          aria-hidden="true"
        >
          !
        </div>
        <p id="report-alert-message" className="mt-4 text-base font-semibold text-[#1B2632] text-balance">
          {message}
        </p>
        <button
          ref={understoodRef}
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FFB162] text-sm font-bold text-[#1B2632] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3B4D] md:w-40"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {REPORT_MESSAGES.understood}
        </button>
      </div>
    </div>
  );
}
