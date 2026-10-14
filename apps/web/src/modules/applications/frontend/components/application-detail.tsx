import type { ReactNode } from "react";

export type ApplicationStatus =
  | "PENDING"
  | "APPROVED"
  | "OBSERVED"
  | "REJECTED";

export type ChecklistItem = { label: string; checked: boolean };

export type Application = {
  id: string;
  code: string;
  status: ApplicationStatus;
  firstName: string;
  lastName: string;
  ci: string;
  segipValidated: boolean;
  institutionalEmail: string;
  phone: string;
  sisCode: string;
  career: string;
  graduationYear: string;
  submittedAt: string;
  procedureType: string;
  procedureMode: string;
  documentName: string;
  documentUrl: string;
  checklist: ChecklistItem[];
};

// TODO(fase 2): borrar este mock cuando exista el endpoint real
export const MOCK_APPLICATION: Application = {
  id: "app-001",
  code: "REG-2024-8841B",
  status: "PENDING",
  firstName: "Juan Carlos",
  lastName: "Pérez Mamani",
  ci: "6842109 CB",
  segipValidated: true,
  institutionalEmail: "carlos.perez.m@correo.umss.edu.bo",
  phone: "+591 70745821",
  sisCode: "201804921",
  career: "Licenciatura en Ingeniería de Sistemas — Fac. Ciencias y Tecnología",
  graduationYear: "Gestión 2023 (II/2023)",
  submittedAt: new Date(Date.now() - 52 * 36e5).toISOString(), // hace 52 h
  procedureType:
    "Título en Provisión Nacional • Resolución Rectoral No. 1048/2023",
  procedureMode: "Original",
  documentName: "titulo_academico.pdf",
  documentUrl: "https://example.com/titulo_academico.pdf",
  checklist: [
    {
      label: "Identidad y Cédula de Identidad cotejada con padrón SEGIP",
      checked: true,
    },
    {
      label: "Código SIS corresponde a la Facultad de Ciencias y Tecnología",
      checked: true,
    },
    {
      label: "Resolución rectoral de defensa de grado homologada (Pendiente)",
      checked: false,
    },
  ],
};

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Pendiente de validación",
  APPROVED: "Aprobado",
  OBSERVED: "Observado",
  REJECTED: "Rechazado",
};

export const OVERDUE_HOURS = 48;

export function hoursSince(isoDate: string) {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 36e5);
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-[#C9C1B1] bg-white p-3 ${className}`}
    >
      <dt className="text-[11px] font-medium uppercase leading-4 tracking-wide text-[#2C3B4D]">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] font-semibold leading-5 text-[#1B2632]">
        {children}
      </dd>
    </div>
  );
}

type Props = {
  application: Application;
};

export function ApplicationDetail({ application }: Props) {
  const hours = hoursSince(application.submittedAt);
  const overdue = hours > OVERDUE_HOURS;
  const validated = application.checklist.filter((i) => i.checked).length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Columna izquierda: información declarada */}
      <section className="space-y-4">
        <div>
          <h3 className="text-[24px] font-semibold leading-8 text-[#1B2632]">
            Información Declarada
          </h3>
          <p className="text-[14px] font-medium leading-5 text-[#2C3B4D]">
            Cotejo de datos con Sistema Integrado Académico (SIA-UMSS)
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <Field label="Nombres">{application.firstName}</Field>
          <Field label="Apellidos">{application.lastName}</Field>
          <Field label="Cédula de identidad">
            <span className="flex items-center justify-between gap-2">
              {application.ci}
              {application.segipValidated && (
                <span className="text-[11px] font-bold text-[#A35139]">
                  ✓ SEGIP
                </span>
              )}
            </span>
          </Field>
          <Field label="Correo institucional">
            <span className="break-all">{application.institutionalEmail}</span>
          </Field>
          <Field label="Teléfono / Móvil">{application.phone}</Field>
          <Field label="Código SIS">{application.sisCode}</Field>
          <Field label="Carrera / Programa académico" className="col-span-2">
            {application.career}
          </Field>
          <Field label="Año de conclusión / egreso">
            {application.graduationYear}
          </Field>
          <Field label="Fecha de envío">
            <span className="flex items-center justify-between gap-2">
              {new Date(application.submittedAt).toLocaleString("es-BO")}
              <span
                className={`text-[12px] font-bold ${
                  overdue ? "text-[#A35139]" : "text-[#2C3B4D]"
                }`}
              >
                {overdue && "⚠ "}
                {hours}h
              </span>
            </span>
          </Field>
          <Field label="Tipo de trámite requerido" className="col-span-2">
            <span className="flex items-center justify-between gap-2">
              {application.procedureType}
              <span className="shrink-0 rounded bg-[#FFB162] px-2 py-0.5 text-[11px] font-bold text-[#1B2632]">
                {application.procedureMode}
              </span>
            </span>
          </Field>
        </dl>

        <div className="rounded-lg border border-[#C9C1B1] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[13px] font-semibold uppercase text-[#1B2632]">
              Lista de chequeo institucional
            </h4>
            <span className="text-[12px] font-semibold text-[#2C3B4D]">
              {validated} / {application.checklist.length} Validados
            </span>
          </div>
          <ul className="space-y-2">
            {application.checklist.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 rounded-lg border border-[#C9C1B1] bg-[#EEE9DF] p-2 text-[13px] leading-5"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] text-white ${
                    item.checked
                      ? "bg-[#2C3B4D]"
                      : "border border-[#C9C1B1] bg-white"
                  }`}
                >
                  {item.checked && "✓"}
                </span>
                <span
                  className={
                    item.checked
                      ? "text-[#1B2632]"
                      : "font-semibold text-[#A35139]"
                  }
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Columna derecha: documento adjunto */}
      <section className="flex flex-col rounded-2xl bg-[#1B2632] p-4 text-white">
        <div className="mb-3">
          <p className="text-[11px] font-medium leading-4 text-[#C9C1B1]">
            Documento digitalizado
          </p>
          <p className="text-[14px] font-semibold leading-5">
            {application.documentName}
          </p>
        </div>

        <div className="flex min-h-[260px] flex-1 items-center justify-center rounded-lg border border-[#2C3B4D] bg-[#2C3B4D]/40 p-4 text-center text-[13px] leading-5 text-[#C9C1B1]">
          Vista previa del documento
          <br />
          (fase 2: URL firmada de 5 minutos)
        </div>

        <a
          href={application.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#FFB162] px-6 text-[14px] font-bold text-[#1B2632]"
        >
          Abrir documento en otra pestaña
        </a>
      </section>
    </div>
  );
}