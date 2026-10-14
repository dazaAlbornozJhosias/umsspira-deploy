'use client';

import { useEffect } from 'react';
import { Check, FileText, Home, X } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { SubmissionConfirmation, type SubmittedDocumentType } from './submission-confirmation';
import type { DocumentType } from '../services';
import { formatFileSize } from '../validation/document-file';
import type { SubmittedRegistration } from '../services';

const DOCUMENT_TYPE_MAP: Record<DocumentType, SubmittedDocumentType> = {
  titulo_provision_nacional: 'national-title',
  diploma_academico: 'academic-diploma',
  certificado_egreso: 'graduation-certificate',
};

export interface SubmissionSuccessModalProps {
  submission: SubmittedRegistration;
  submittedAt: Date | string;
  documentType: DocumentType;
  fullName: string;
  idNumber: string;
  email: string;
  fileName: string;
  fileSizeBytes: number;
  onGoHome: () => void;
  onClose: () => void;
}

/**
 * Modal de confirmación tras registrar la solicitud (CA-03.2).
 * Reutiliza el componente SubmissionConfirmation con los datos reales del envío
 * y agrega el código de trámite, el archivo adjunto, el estado y el botón de salida.
 */
export function SubmissionSuccessModal({
  submission,
  submittedAt,
  documentType,
  fullName,
  idNumber,
  email,
  fileName,
  fileSizeBytes,
  onGoHome,
  onClose,
}: SubmissionSuccessModalProps) {
  // Referencia corta y legible del trámite a partir del identificador real.
  const trackingCode = submission?.idSolicitud?.replace(/-/g, '').slice(0, 8).toUpperCase() || 'N/A';

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-success-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-abyssal-blue/60 backdrop-blur-sm" />

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-palladian p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border border-oatmeal bg-white text-abyssal-blue hover:bg-oatmeal/40"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-burning-flame">
            <Check aria-hidden="true" className="h-8 w-8 text-abyssal-blue" strokeWidth={3} />
          </span>
          <h2 id="submission-success-title" className="mt-4 text-2xl font-bold text-abyssal-blue">
            ¡Solicitud enviada con éxito!
          </h2>
          <p className="mt-2 text-sm text-abyssal-blue/70">
            Su expediente ha sido ingresado al sistema institucional de validación académica.
          </p>
        </div>

        <dl className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-oatmeal bg-white px-4 py-3">
          <dt className="text-sm text-abyssal-blue/70">Código de trámite</dt>
          <dd className="rounded-md bg-burning-flame/30 px-2.5 py-1 text-sm font-bold tracking-wide text-abyssal-blue">
            {trackingCode}
          </dd>
        </dl>

        <div className="mt-4">
          <SubmissionConfirmation
            submittedAt={submittedAt}
            documentType={DOCUMENT_TYPE_MAP[documentType]}
            fullName={fullName}
            idNumber={idNumber}
            email={email}
          />
        </div>

        <dl className="mt-4 space-y-3 rounded-xl border border-oatmeal bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex min-w-0 items-center gap-2 text-sm text-abyssal-blue/70">
              <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-truffle-trouble" />
              <span className="truncate font-medium text-abyssal-blue" title={fileName}>
                {fileName} ({formatFileSize(fileSizeBytes)})
              </span>
            </dt>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-abyssal-blue/70">Estado del proceso</dt>
            <dd className="inline-flex items-center gap-1.5 rounded-full bg-abyssal-blue px-3 py-1 text-xs font-semibold text-white">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-burning-flame" />
              {submission.estado}
            </dd>
          </div>
        </dl>

        <Button
          type="button"
          onClick={onGoHome}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 bg-burning-flame text-base font-bold text-abyssal-blue hover:bg-burning-flame/90"
        >
          Ir al inicio
          <Home aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
