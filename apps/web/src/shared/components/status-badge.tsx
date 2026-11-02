import { ApplicantStatus } from "../types/applicant";

const STATUS_STYLES: Record<ApplicantStatus, string> = {
  Postulado: "bg-gray-100 text-gray-700",
  "En revisión": "bg-orange-50 text-orange-700",
  Preseleccionado: "bg-sky-50 text-sky-700",
  Entrevistado: "bg-violet-50 text-violet-700",
  Descartado: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: ApplicantStatus }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}