"use client";

import { useState } from "react";
import { Applicant } from "../types/applicant";
import {
  MATCH_UNAVAILABLE_LABEL,
  clampForDisplay,
  formatMatch,
  getMatchLevel,
  hasMatch,
  skillBarColor,
} from "../utils/match-format";
import { formatDate, getInitials } from "../utils/format";

type Tab = "perfil" | "coincidencia" | "cv" | "historial";

const TABS: { id: Tab; label: string }[] = [
  { id: "perfil", label: "Perfil" },
  { id: "coincidencia", label: "Coincidencia técnica" },
  { id: "cv", label: "CV" },
  { id: "historial", label: "Historial" },
];

export function MatchBreakdownView({
  applicant,
  onBack,
}: {
  applicant: Applicant;
  onBack?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("coincidencia");

  const matchAvailable = hasMatch(applicant.matchPercentage);
  const level = getMatchLevel(applicant.matchPercentage);
  const skills = applicant.skills ?? [];

  return (
    <div className="space-y-6">
      {/* Barra superior: Volver + acciones */}
      <div className="flex items-center justify-between gap-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-sm font-semibold text-[#1B2632] hover:underline flex items-center gap-1"
          >
            ← Volver
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          {applicant.cvUrl ? (
            <a
              href={applicant.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-bold text-[#1B2632] bg-white border border-[#EEE9DF] rounded-lg hover:bg-gray-50"
            >
              Descargar CV
            </a>
          ) : (
            <button
              disabled
              title="CV no disponible"
              className="px-4 py-2 text-xs font-bold text-gray-400 bg-white border border-[#EEE9DF] rounded-lg cursor-not-allowed"
            >
              Descargar CV
            </button>
          )}
          <a
            href={`mailto:${applicant.email}`}
            className="px-4 py-2 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600"
          >
            Contactar
          </a>
        </div>
      </div>

      {/* Cabecera del candidato */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EEE9DF] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#EEE9DF] text-[#1B2632] font-bold flex items-center justify-center text-xl shrink-0">
            {getInitials(applicant.name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#1B2632]">{applicant.name}</h2>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                {applicant.experienceLevel}
              </span>
            </div>
            <p className="text-sm text-gray-500">{applicant.email}</p>
            <p className="text-sm text-gray-500">{applicant.location}</p>
          </div>
        </div>

        <div
          className={`px-4 py-2 rounded-xl border ${
            matchAvailable ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
          }`}
        >
          <span
            className={`text-lg font-bold ${matchAvailable ? "text-emerald-700" : "text-gray-500"}`}
          >
            {formatMatch(applicant.matchPercentage)}
          </span>
          <p className="text-[11px] text-gray-500 font-medium">Coincidencia técnica</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-[#EEE9DF]" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-[#1B2632]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pestaña: Perfil */}
      {activeTab === "perfil" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EEE9DF] grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#1B2632]">
          <div>
            <p className="text-xs text-gray-500">Correo</p>
            <p className="font-medium">{applicant.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ubicación</p>
            <p className="font-medium">{applicant.location}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Nivel de experiencia</p>
            <p className="font-medium">{applicant.experienceLevel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Estado</p>
            <p className="font-medium">{applicant.status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Fecha de postulación</p>
            <p className="font-medium">{formatDate(applicant.appliedAt)}</p>
          </div>
        </div>
      )}

      {/* Pestaña: Coincidencia técnica (CA-03, CA-04) */}
      {activeTab === "coincidencia" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EEE9DF] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Dona con el porcentaje general recibido */}
            <div className="flex flex-col items-center justify-center p-6">
              <h3 className="text-sm font-bold text-[#1B2632] mb-4">
                Resultado de coincidencia técnica
              </h3>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {matchAvailable && (
                    <path
                      className="text-emerald-500"
                      strokeDasharray={`${clampForDisplay(applicant.matchPercentage as number)}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <div className="absolute flex flex-col items-center text-center px-4">
                  <span
                    className={`font-bold ${
                      matchAvailable ? "text-3xl text-[#1B2632]" : "text-sm text-gray-500"
                    }`}
                  >
                    {formatMatch(applicant.matchPercentage)}
                  </span>
                  {level && (
                    <>
                      <span className="text-[11px] text-gray-500">Coincidencia técnica</span>
                      <span className="text-[11px] font-semibold text-emerald-600">{level}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Desglose por habilidad (valores tal cual los envía la API) */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1B2632] mb-2">Desglose por habilidades</h3>
              {skills.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Desglose por habilidades: {MATCH_UNAVAILABLE_LABEL.toLowerCase()}.
                </p>
              ) : (
                skills.map((s) => (
                  <div key={s.skill} className="grid grid-cols-[110px_1fr_44px] items-center gap-3">
                    <span className="text-xs font-medium text-[#1B2632]">{s.skill}</span>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${skillBarColor(s.percentage)}`}
                        style={{
                          width: `${hasMatch(s.percentage) ? clampForDisplay(s.percentage) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#1B2632] text-right">
                      {formatMatch(s.percentage)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resumen (solo si hay porcentaje recibido) */}
          {matchAvailable ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
              <p>
                El candidato cumple con el <strong>{applicant.matchPercentage}%</strong> de los
                requisitos técnicos de la vacante.
              </p>
              {level === "Alta" && (
                <p className="text-xs mt-1">
                  Se recomienda considerarlo para la siguiente etapa del proceso.
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm">
              El porcentaje de coincidencia técnica no está disponible para este postulante.
            </div>
          )}
        </div>
      )}

      {/* Pestañas sin contenido definido todavía */}
      {(activeTab === "cv" || activeTab === "historial") && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#EEE9DF] text-center text-sm text-gray-500">
          Información no disponible por el momento.
        </div>
      )}
    </div>
  );
}