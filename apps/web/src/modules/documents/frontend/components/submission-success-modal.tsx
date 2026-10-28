'use client';

import { useEffect } from 'react';
import { Check, Home, X } from 'lucide-react';
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
 * Muestra el encabezado y el botón de salida, y delega el resumen de datos en SubmissionConfirmation.
 * El código interno TIT no se expone en la vista pública (CA-07.6).
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

      <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-palladian p-4 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-oatmeal bg-white text-abyssal-blue hover:bg-oatmeal/40"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-burning-flame">
            <Check aria-hidden="true" className="h-6 w-6 text-abyssal-blue" strokeWidth={3} />
          </span>
          <h2 id="submission-success-title" className="mt-2 text-xl font-bold text-abyssal-blue">
            ¡Solicitud enviada con éxito!
          </h2>
          <p className="mt-1 text-xs text-abyssal-blue/70">
            Su expediente ha sido ingresado al sistema institucional de validación académica.
          </p>
        </div>

        <div className="mt-3">
          <SubmissionConfirmation
            submittedAt={submittedAt}
            documentType={DOCUMENT_TYPE_MAP[documentType]}
            fullName={fullName}
            idNumber={idNumber}
            email={email}
            fileName={fileName}
            fileSizeLabel={formatFileSize(fileSizeBytes)}
            status={submission.estado}
          />
        </div>

        <Button
          type="button"
          onClick={onGoHome}
          className="bg-burning-flame text-abyssal-blue hover:bg-burning-flame/90 hover:text-abyssal-blue disabled:hover:bg-burning-flame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-abyssal-blue focus-visible:ring-offset-2 mt-3 inline-flex h-11 w-full items-center justify-center gap-2 text-base font-bold"
        >
          Ir al inicio
          <Home aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}