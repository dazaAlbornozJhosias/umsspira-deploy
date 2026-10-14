"use client";

import React from "react";
import mockData from "../mocks/affinity-vector-mock.json";
import { formatPercentage } from "@/shared/utils/percentage";

// 1. Tipado estricto de la evidencia tal como viene en el JSON
export interface EvidenceItem {
  type: 'certification' | 'project';
  title: string;
  detail?: string;
}

export interface AreaData {
  area: string;
  affinity: number;
  evidence?: EvidenceItem[];
}

interface RadarInspectionProps {
  selectedAreaId: string | null;
  onSelectArea: (id: string | null) => void;
  areas?: AreaData[];
}

// 2. Diccionario estricto de ids a los nombres de la HU2-C3 (Inciso 4)
const AREA_NAMES_MAP: Record<string, string> = {
  "software-development": "Desarrollo de Software",
  "cloud-devops": "Cloud/DevOps",
  "data-ai": "Ciencia de Datos/IA",
  "quality-assurance": "QA",
  "cybersecurity-networks": "Ciberseguridad",
  "it-management": "Gestión TI",
};

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      {/* Panel izquierdo: Resumen de las áreas */}
      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Resumen de Afinidad por Área</h3>
        <p className="text-sm text-gray-500">Haz clic en un área para inspeccionar sus respaldos</p>
        
        <div className="space-y-3">
          {areas.map((item, index) => {
            // Se usa el diccionario de la HU2-C3 en lugar de replace("-", " ")
            const displayName = AREA_NAMES_MAP[item.area] || item.area;
            const isSelected = selectedAreaId === item.area;

            return (
              <div
                key={index}
                onClick={() => {
                  // Si ya estaba seleccionada, la deseleccionamos mandando null; si no, mandamos su id
                  onSelectArea(isSelected ? null : item.area);
                }}
                className={`p-3 border rounded-lg cursor-pointer transition ${
                  isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">{displayName}</span>
                  <span className="text-sm font-semibold text-blue-600">{formatPercentage(item.affinity)}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${item.affinity}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel derecho: Inspección detallada y respaldos filtrados */}
      <div className="flex flex-col p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Respaldos e Inspección</h3>
        
        {selectedArea ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-bold text-blue-700">
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
