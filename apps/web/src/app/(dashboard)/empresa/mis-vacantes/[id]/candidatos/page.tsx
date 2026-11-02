"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Applicant, APPLICANT_STATUSES, EXPERIENCE_LEVELS } from "@/shared/types/applicant";
import { Vacancy } from "@/shared/types/vacancy";
import {
  getApplicantsByVacancy,
  MATCH_ENGINE_ERROR_MESSAGE,
} from "@/shared/services/applicants";
import { getVacancyById } from "@/shared/services/vacancies";
import { useApplicantFilters } from "@/shared/hooks/useApplicantFilters";
import { MatchSlider } from "@/shared/components/match-slider";
import { VacancyHeader } from "@/shared/components/vacancy-header";
import { StatusBadge } from "@/shared/components/status-badge";
import { clampForDisplay, formatMatch, hasMatch, listBarColor } from "@/shared/utils/match-format";
import { formatDate, getInitials } from "@/shared/utils/format";

export default function CandidatesPage() {
  const params = useParams();
  const router = useRouter();
  const vacancyId = params?.id as string;

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [list, vac] = await Promise.all([
          getApplicantsByVacancy(vacancyId),
          // Si falla la vacante, solo se oculta su tarjeta
          getVacancyById(vacancyId).catch(() => null),
        ]);
        if (!cancelled) {
          setApplicants(list);
          setVacancy(vac);
        }
      } catch {
        // CA-08 / CA-09: no se muestran datos de la petición fallida
        if (!cancelled) {
          setApplicants([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [vacancyId, reloadKey]);

  const {
    searchTerm,
    setSearchTerm,
    minMatch,
    setMinMatch,
    selectedStatus,
    setSelectedStatus,
    selectedLevel,
    setSelectedLevel,
    filteredApplicants,
    handleClearFilters,
  } = useApplicantFilters(applicants);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado + Volver */}
      <div className="space-y-2">
        <button
          onClick={() => router.push("/empresa/mis-vacantes")}
          className="text-sm font-semibold text-[#1B2632] hover:underline flex items-center gap-1"
        >
          ← Volver
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2632]">Postulantes</h1>
          <p className="text-sm text-gray-500">
            Revisa los postulantes de la vacante y encuentra el mejor talento.
          </p>
          {/* Quitar cuando exista la API de postulantes (Epic 5) */}
          <p className="mt-1 text-xs text-gray-400">Postulantes de ejemplo</p>
        </div>
      </div>

      {vacancy && <VacancyHeader vacancy={vacancy} />}

      {/* CA-06: estado de carga */}
      {loading && (
        <div className="p-8 text-center text-[#1B2632] font-medium" role="status">
          Cargando candidatos...
        </div>
      )}

      {/* CA-08 / CA-09: error de conexión o del servidor */}
      {!loading && error && (
        <div className="p-8 max-w-xl mx-auto text-center space-y-4" role="alert">
          <p className="text-[#A35139] font-semibold">{MATCH_ENGINE_ERROR_MESSAGE}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#1B2632] rounded-lg hover:bg-opacity-90"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* CA-07: la vacante no tiene postulantes */}
      {!loading && !error && applicants.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No existen postulantes para esta vacante.
        </div>
      )}

      {!loading && !error && applicants.length > 0 && (
        <>
          {/* Filtros */}
          <div className="bg-white p-5 rounded-xl border border-[#EEE9DF] shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-6 items-end">
              <MatchSlider value={minMatch} onChange={setMinMatch} />

              <div className="space-y-1">
                <label className="text-sm font-medium text-[#1B2632]">Estado del postulante</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB162]"
                >
                  <option value="Todos">Todos</option>
                  {APPLICANT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-[#1B2632]">Nivel de experiencia</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB162]"
                >
                  <option value="Todos">Todos</option>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <input
                type="text"
                placeholder="Buscar candidato"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-md px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB162]"
              />
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-xs font-semibold text-[#1B2632] border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Tabla de postulantes */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">
              Mostrando {filteredApplicants.length} de {applicants.length} postulantes
            </p>

            {filteredApplicants.length === 0 ? (
              <div className="bg-white p-8 rounded-xl text-center border border-[#EEE9DF] text-gray-500">
                Ningún postulante cumple con los filtros aplicados.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#EEE9DF] shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 border-b border-[#EEE9DF]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Candidato</th>
                      <th className="px-4 py-3 font-semibold">Coincidencia técnica</th>
                      <th className="px-4 py-3 font-semibold">Nivel de experiencia</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold">Fecha de postulación</th>
                      <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplicants.map((applicant) => (
                      <tr key={applicant.id} className="border-b border-[#EEE9DF] last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#EEE9DF] text-[#1B2632] text-xs font-bold flex items-center justify-center shrink-0">
                              {getInitials(applicant.name)}
                            </div>
                            <span className="font-semibold text-[#1B2632]">{applicant.name}</span>
                          </div>
                        </td>

                        {/* CA-02 / CA-05 / CA-10: valor recibido o "No disponible" */}
                        <td className="px-4 py-3">
                          {hasMatch(applicant.matchPercentage) ? (
                            <div className="flex items-center gap-3 min-w-[170px]">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${listBarColor(applicant.matchPercentage)}`}
                                  style={{ width: `${clampForDisplay(applicant.matchPercentage)}%` }}
                                />
                              </div>
                              <span className="font-bold text-[#1B2632] w-10 text-right">
                                {formatMatch(applicant.matchPercentage)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">{formatMatch(null)}</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-[#1B2632]">{applicant.experienceLevel}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={applicant.status} />
                        </td>
                        <td className="px-4 py-3 text-[#1B2632]">{formatDate(applicant.appliedAt)}</td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {/* Ver detalle -> segunda página */}
                            <Link
                              href={`/empresa/mis-vacantes/${vacancyId}/candidatos/${applicant.id}`}
                              aria-label={`Ver detalle de ${applicant.name}`}
                              title="Ver detalle"
                              className="p-1.5 rounded-md text-[#1B2632] hover:bg-gray-100"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="w-5 h-5"
                                aria-hidden="true"
                              >
                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </Link>
                            <button
                              disabled
                              title="Más acciones (próximamente)"
                              aria-label="Más acciones"
                              className="px-2 py-1 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed text-xs font-bold"
                            >
                              ···
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}