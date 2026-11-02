import { Vacancy, VacancyStatus } from "../types/vacancy";
import { formatDate } from "../utils/format";

const STATUS_STYLES: Record<VacancyStatus, string> = {
  Activa: "bg-emerald-50 text-emerald-700",
  Pausada: "bg-amber-50 text-amber-700",
  Cerrada: "bg-gray-200 text-gray-700",
  Borrador: "bg-sky-50 text-sky-700",
};

export function VacancyHeader({ vacancy }: { vacancy: Vacancy }) {
  return (
    <div className="bg-white rounded-xl border border-[#EEE9DF] shadow-sm p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <rect x="4" y="3" width="12" height="18" rx="1" />
            <path d="M16 9h4v12h-4M8 7h4M8 11h4M8 15h4" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-[#1B2632]">{vacancy.title}</h2>
          <p className="text-xs text-gray-500">Publicado el {formatDate(vacancy.publishedAt)}</p>
        </div>
      </div>

      <span
        className={`px-3 py-1 rounded-md text-xs font-semibold ${STATUS_STYLES[vacancy.status]}`}
      >
        {vacancy.status}
      </span>
    </div>
  );
}