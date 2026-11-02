"use client";

import React from "react";
import mockData from "../mocks/affinity-vector-mock.json";
import { AFFINITY_AREA_LABELS } from "@umsspira/shared-types/src/affinity";
import { formatPercentage } from "@/shared/utils/percentage";
import { InfluentialKeywords } from './affinity-influential-keywords';
import { calculateVariation } from "@/shared/utils/affinity-variation";
import { VariationIndicator } from "./variation-indicator";
import type { AffinityKeywordContribution } from "@umsspira/shared-types";

// 1. Tipado estricto de la evidencia tal como viene en el JSON
export interface EvidenceItem {
  type: 'certification' | 'project';
  title: string;
  detail?: string;
}

export interface AreaData {
  area: string;
  affinity: number;
  previousAffinity?: number | null;
  evidence?: EvidenceItem[];
  topKeywords?: AffinityKeywordContribution[];

}

interface RadarInspectionProps {
  selectedAreaId: string | null;
  onSelectArea: (id: string | null) => void;
  areas?: AreaData[];
}

// 2. Diccionario de ids a los nombres oficiales de shared-types (CA-HU7-22)
export const AREA_NAMES_MAP: Record<string, string> = AFFINITY_AREA_LABELS;

// Colores del mockup por área, asociados al id técnico (no a la posición en la lista)
const AREA_COLORS_MAP: Record<string, { bar: string; text: string }> = {
  "software-development": { bar: "bg-orange-300", text: "text-orange-300" },
  "cloud-devops": { bar: "bg-[#A94B3A]", text: "text-[#A94B3A]" },
  "data-ai": { bar: "bg-slate-800", text: "text-slate-800" },
  "quality-assurance": { bar: "bg-[#CBBFB0]", text: "text-[#CBBFB0]" },
  "cybersecurity-networks": { bar: "bg-slate-500", text: "text-slate-500" },
  "it-management": { bar: "bg-slate-800", text: "text-slate-800" },
};

// El texto del porcentaje de estas áreas va en tono ladrillo para mantener legibilidad (mockup)
const BRICK_TEXT_AREA_IDS = new Set(["software-development", "cloud-devops"]);

export default function RadarInspection({ 
  selectedAreaId, 
  onSelectArea,
  areas = (mockData.areas || []) as unknown as AreaData[]
}: RadarInspectionProps) {

  // 3. Estado vacío actualizado: SOLO muestra el mensaje, sin botón "Completar perfil"
  if (!areas || areas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-gray-500 bg-white shadow-sm">
        <p className="text-lg font-medium text-center">Sin datos de historial laboral</p>
      </div>
    );
  }

  // 4. Panel controlado: Busca el área basándose únicamente en la prop externa (Inciso 2)
  const selectedArea = areas.find((item) => item.area === selectedAreaId);

  // 5. Filtrado de evidencias sin tocar el JSON (Inciso 3)
  const certifications = selectedArea?.evidence?.filter((e) => e.type === 'certification') || [];
  const projects = selectedArea?.evidence?.filter((e) => e.type === 'project') || [];

  // Si alguna fila tiene variación, se reserva la columna del chip para que
  // todos los porcentajes queden alineados aunque el chip cambie de ancho.
  const hasAnyVariation = areas.some(
    (item) => calculateVariation(item.affinity, item.previousAffinity) !== null,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      {/* Panel izquierdo: Resumen de las áreas */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-800 leading-tight">Resumen de tu afinidad</h3>
          <div className="text-sm text-gray-500 text-right leading-tight shrink-0">
            <span className="block">{areas.length} áreas</span>
            <span className="block">evaluadas</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">Haz clic en un área para inspeccionar sus respaldos</p>
        
        <div className="space-y-3">
          {[...areas]
            .sort((a, b) => b.affinity - a.affinity)
            .map((item, index) => {
            // Se usa el diccionario de la HU2-C3 en lugar de replace("-", " ")
            const displayName = AREA_NAMES_MAP[item.area] || item.area;
            const isSelected = selectedAreaId === item.area;
            const colors = AREA_COLORS_MAP[item.area] ?? { bar: "bg-blue-600", text: "text-blue-600" };
            const percentageColor = BRICK_TEXT_AREA_IDS.has(item.area) ? "text-[#A94B3A]" : "text-slate-800";

            return (
              <div
                key={index}
                onClick={() => {
                  // Si ya estaba seleccionada, la deseleccionamos mandando null; si no, mandamos su id
                  onSelectArea(isSelected ? null : item.area);
                }}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  isSelected ? "bg-blue-50 border-blue-200" : "border border-transparent hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="flex min-w-0 items-center gap-2 font-medium text-gray-700">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${colors.bar}`} />
                    <span className="min-w-0">{displayName}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={`w-12 text-right text-sm font-semibold tabular-nums ${percentageColor}`}>
                      {formatPercentage(item.affinity)}
                    </span>
                    {hasAnyVariation && (
                      <span className="flex w-[5.5rem] justify-end">
                        {/* Misma pieza que el radar para conservar un solo estilo de variación */}
                        <VariationIndicator
                          current={item.affinity}
                          previous={item.previousAffinity ?? null}
                          areaLabel={displayName}
                        />
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
                    style={{ width: `${item.affinity}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500 italic">* Datos calculados en base a materias electivas aprobadas, proyectos de grado indexados y certificaciones validadas.</p>
      </div>

      {/* Panel derecho: Inspección detallada y respaldos filtrados */}
      <div className="flex flex-col p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Respaldos e inspección</h3>
        
        {selectedArea ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-bold text-blue-fantastic">
                Área: {AREA_NAMES_MAP[selectedArea.area] || selectedArea.area}
              </h4>
              <button 
                onClick={() => onSelectArea(null)}
                className="text-xs text-gray-500 hover:text-blue-600 underline"
              >
                Volver al resumen
              </button>
            </div>
            
            <div>
              <h5 className="font-semibold text-sm text-gray-700 mb-1">Certificaciones:</h5>
              {certifications.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {certifications.map((cert, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{cert.title}</span>
                      {cert.detail && <span className="text-xs text-gray-400 block ml-4">{cert.detail}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No hay certificaciones registradas para esta área.</p>
              )}
            </div>

            <div>
              <h5 className="font-semibold text-sm text-gray-700 mb-1">Proyectos:</h5>
              {projects.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {projects.map((proj, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{proj.title}</span>
                      {proj.detail && <span className="text-xs text-gray-400 block ml-4">{proj.detail}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                /* HU2-C9: Manejo cuando el área seleccionada no tiene respaldos asociados */
                <p className="text-sm text-gray-500 italic">Esta área no tiene respaldos asociados.</p>
              )}
            </div>
            <InfluentialKeywords keywords={selectedArea?.topKeywords}/>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <p className="text-sm text-center">Haz clic en un área para inspeccionar sus respaldos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
