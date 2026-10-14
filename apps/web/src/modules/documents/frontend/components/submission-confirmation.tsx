import { maskEmail } from "../../../../shared/utils/mask-email";

export type SubmittedDocumentType =
  | "national-title"
  | "academic-diploma"
  | "graduation-certificate";

const DOCUMENT_TYPE_LABELS: Record<SubmittedDocumentType, string> = {
  "national-title": "Título en Provisión Nacional",
  "academic-diploma": "Diploma Académico",
  "graduation-certificate": "Certificado de Egreso",
};

export interface SubmissionConfirmationProps {
  submittedAt: Date | string;
  documentType: SubmittedDocumentType;
  fullName: string;
  idNumber: string;
  email: string;
  responseDeadlineHours?: number;
}

function formatSubmittedAt(value: Date | string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  }).format(date);
}

export function SubmissionConfirmation({
  submittedAt,
  documentType,
  fullName,
  idNumber,
  email,
  responseDeadlineHours = 48,
}: SubmissionConfirmationProps) {
  const details: Array<[string, string]> = [
    ["Fecha y hora de envío", formatSubmittedAt(submittedAt)],
    ["Tipo de documento", DOCUMENT_TYPE_LABELS[documentType]],
    ["Nombre completo", fullName],
    ["C.I.", idNumber],
    ["Correo", maskEmail(email)],
  ];

  return (
    <section
      aria-labelledby="submission-confirmation-title"
      className="mx-auto w-full max-w-xl rounded-lg border border-oatmeal bg-white p-6 text-abyssal-blue sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burning-flame"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h1 id="submission-confirmation-title" className="text-2xl font-semibold">
          Solicitud enviada
        </h1>
      </div>

      <dl className="mt-6 divide-y divide-oatmeal border-y border-oatmeal">
        {details.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4"
          >
            <dt className="text-sm text-abyssal-blue/70">{label}</dt>
            <dd className="text-sm font-medium sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 rounded-md bg-palladian p-4 text-sm">
        El equipo administrativo revisará tu documento y te responderá por correo en un
        plazo de {responseDeadlineHours} horas.
      </p>
    </section>
  );
}