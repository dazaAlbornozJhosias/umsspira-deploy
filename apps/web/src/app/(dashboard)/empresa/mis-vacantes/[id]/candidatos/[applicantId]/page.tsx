"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Applicant } from "@/shared/types/applicant";
import { Vacancy } from "@/shared/types/vacancy";
import {
  getApplicantById,
  MATCH_ENGINE_ERROR_MESSAGE,
} from "@/shared/services/applicants";
import { getVacancyById } from "@/shared/services/vacancies";
import { VacancyHeader } from "@/shared/components/vacancy-header";
import { MatchBreakdownView } from "@/shared/components/match-breakdown-view";

export default function ApplicantMatchPage() {
  const params = useParams();
  const router = useRouter();
  const vacancyId = params?.id as string;
  const applicantId = params?.applicantId as string;

  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const goBackToList = () => router.push(`/empresa/mis-vacantes/${vacancyId}/candidatos`);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [data, vac] = await Promise.all([
          getApplicantById(vacancyId, applicantId),
          getVacancyById(vacancyId).catch(() => null),
        ]);
        if (!cancelled) {
          setApplicant(data);
          setVacancy(vac);
        }
      } catch {
        if (!cancelled) {
          setApplicant(null);
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
  }, [vacancyId, applicantId, reloadKey]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {vacancy && <VacancyHeader vacancy={vacancy} />}

      {loading && (
        <div className="p-8 text-center text-[#1B2632] font-medium" role="status">
          Cargando candidato...
        </div>
      )}

      {!loading && error && (
        <div className="p-8 max-w-xl mx-auto text-center space-y-4" role="alert">
          <p className="text-[#A35139] font-semibold">{MATCH_ENGINE_ERROR_MESSAGE}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#1B2632] rounded-lg hover:bg-opacity-90"
            >
              Reintentar
            </button>
            <button
              onClick={goBackToList}
              className="px-4 py-2 text-xs font-bold text-[#1B2632] border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      )}

      {!loading && !error && !applicant && (
        <div className="p-8 text-center space-y-4">
          <p className="text-gray-500">No se encontró al postulante.</p>
          <button
            onClick={goBackToList}
            className="px-4 py-2 text-xs font-bold text-[#1B2632] border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Volver a la lista
          </button>
        </div>
      )}

      {!loading && !error && applicant && (
        <MatchBreakdownView applicant={applicant} onBack={goBackToList} />
      )}
    </div>
  );
}