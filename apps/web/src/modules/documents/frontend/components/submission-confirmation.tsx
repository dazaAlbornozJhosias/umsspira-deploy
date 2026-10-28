import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { maskEmail } from '@/shared/utils/mask-email';

export type SubmittedDocumentType = 'national-title' | 'academic-diploma' | 'graduation-certificate';

const DOCUMENT_TYPE_LABELS: Record<SubmittedDocumentType, string> = {
  'national-title': 'Título en Provisión Nacional',
  'academic-diploma': 'Diploma Académico',
  'graduation-certificate': 'Certificado de Egreso',
};

export interface SubmissionConfirmationProps {
  submittedAt: Date | string;
  documentType: SubmittedDocumentType;
  fullName: string;
  idNumber: string;
  email: string;
  fileName?: string;
  fileSizeLabel?: string;
  status?: string;
  responseDeadlineHours?: number;
}

function formatSubmittedAt(value: Date | string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(date);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-xs text-abyssal-blue/70">{label}</dt>
      <dd className="min-w-0 text-right text-xs font-semibold text-abyssal-blue">{children}</dd>
    </div>
  );
}

/**
 * Resumen de la solicitud enviada (CA-03.2 y CA-07.6). Sigue el orden del mockup:
 * postulante, documento adjunto, fecha y hora, y estado del proceso; los datos que pide
 * el criterio (C.I., correo enmascarado y tipo de documento) van junto a su fila relacionada.
 * El codigo interno TIT vive solo en el backend y en la bandeja administrativa: no se muestra
 * aqui ni se rellena con N/A.
 * El titulo, el subtitulo y el boton de salida pertenecen al contenedor que lo muestra.
 */
export function SubmissionConfirmation({
  submittedAt,
  documentType,
  fullName,
  idNumber,
  email,
  fileName,
  fileSizeLabel,
  status,
  responseDeadlineHours = 48,
}: SubmissionConfirmationProps) {
  return (
    <section aria-label="Resumen de la solicitud">
      <dl className="divide-y divide-oatmeal/60 rounded-xl border border-oatmeal bg-white/60 px-4 py-1">
        <Row label="Postulante">{fullName}</Row>
        <Row label="C.I.">{idNumber}</Row>
        <Row label="Correo">{maskEmail(email)}</Row>
        {fileName && (
          <Row label="Documento adjunto">
            <span className="inline-flex max-w-full items-center gap-1.5">
              <FileText aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-truffle-trouble" />
              <span className="truncate" title={fileName}>
                {fileSizeLabel ? `${fileName} (${fileSizeLabel})` : fileName}
              </span>
            </span>
          </Row>
        )}
        <Row label="Tipo de documento">{DOCUMENT_TYPE_LABELS[documentType]}</Row>
        <Row label="Fecha y hora">{formatSubmittedAt(submittedAt)}</Row>
        {status && (
          <Row label="Estado del proceso">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-abyssal-blue px-2.5 py-0.5 text-white">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-burning-flame" />
              {status}
            </span>
          </Row>
        )}
      </dl>

      <p className="mt-3 rounded-md bg-oatmeal/30 p-3 text-xs text-abyssal-blue">
        El equipo administrativo revisará tu documento y te responderá por correo en un plazo de{' '}
        {responseDeadlineHours} horas.
      </p>
    </section>
  );
}