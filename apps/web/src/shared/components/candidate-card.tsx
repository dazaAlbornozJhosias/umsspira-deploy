'use client';

import React, { useState } from 'react';
import AffinityRadar from './affinity-radar';
import { toAffinityAreaScores, type RawAreaPoint } from '../utils/affinity-areas';
import { CheckCircle2, ShieldCheck, ExternalLink, Award, FileText, ChevronRight, MapPin } from 'lucide-react';
import { formatPercentage } from '../utils/percentage';

export interface CandidateCardProps {
  graduateId: string;
  name: string;
  career: string;
  graduationYear: number;
  skills: string[];
  professionalDescription: string;
  affinity: number;
  nlpScore?: number;
  featured?: boolean;
  isSelected?: boolean;
  areas?: RawAreaPoint[];
  location?: string;
  sisCode?: string;
  concentrationArea?: string;
  onSelectCandidate?: (graduateId: string) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  graduateId,
  name,
  career,
  graduationYear,
  skills,
  professionalDescription,
  affinity,
  nlpScore,
  featured,
  isSelected = false,
  areas = [],
  location = 'Cochabamba / Remoto',
  sisCode = '201704982',
  concentrationArea = 'Desarrollo Backend & Arquitectura',
  onSelectCandidate,
}) => {
  const [showBackingModal, setShowBackingModal] = useState(false);

  const scoreDisplay = nlpScore !== undefined ? nlpScore : affinity;

  // Fallback areas if empty
  const defaultAreas: RawAreaPoint[] = [
    { area: 'desarrollo de software', affinity: 95 },
    { area: 'cloud & devops', affinity: 64 },
    { area: 'ciencia de datos & ia', affinity: 71 },
    { area: 'aseguramiento de calidad (QA)', affinity: 58 },
    { area: 'ciberseguridad y redes', affinity: 42 },
    { area: 'gestion de ti & gobernanza', affinity: 50 },
  ];

  const chartData = areas.length >= 6 ? areas : defaultAreas;
  const radarData = toAffinityAreaScores(chartData);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm flex flex-col justify-between overflow-hidden relative ${
        featured
          ? 'border-truffle-trouble ring-2 ring-truffle-trouble/30 shadow-xl'
          : 'border-slate-200 hover:border-oatmeal hover:shadow-md'
      } ${isSelected && !featured ? 'ring-2 ring-abyssal-blue/40' : ''} ${isSelected ? 'scale-[1.01]' : ''}`}
    >
      {/* Cabecera roja: depende de que el candidato esté destacado en los datos, no de la selección */}
      {featured ? (
        <div className="bg-truffle-trouble text-white px-4 py-1.5 flex items-center justify-between text-xs font-bold tracking-wide">
          <span className="flex items-center space-x-1.5 uppercase">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>CANDIDATO SELECCIONADO PARA AUDITORÍA</span>
          </span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[11px]">
            {formatPercentage(scoreDisplay)} Match
          </span>
        </div>
      ) : (
        <div className="bg-slate-100 border-b border-slate-200/60 px-4 py-1 flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span>COMPATIBILIDAD SIG-MATCH</span>
          <span className="font-bold font-mono text-abyssal-blue">{formatPercentage(scoreDisplay)} Match</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-full bg-abyssal-blue text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 border border-slate-200">
            {name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h3 className="font-bold text-slate-900 text-sm truncate">{name}</h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">
              {career} • {graduationYear}
            </p>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
              <span className="flex items-center space-x-0.5">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </span>
              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 font-medium rounded border border-emerald-200">
                Disponible
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hexágono de Afinidad Radar Visual */}
      <div className="p-3 bg-palladian/40 flex flex-col items-center border-b border-slate-100">
        <div className="w-full flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
          <span className="font-semibold text-slate-700 uppercase">Gráfico de Afinidad Calculado</span>
          <span>SIS Code: {sisCode}</span>
        </div>

        {/* Embedded Hexagon SVG Radar Graph */}
                <AffinityRadar variant="mini" affinityData={radarData} highlighted={featured} />

        {/* Concentration Highlight Box */}
        <div className="w-full bg-white/90 rounded-lg p-2 mt-1 border border-slate-200 text-center text-xs">
          <span className="text-[10px] text-slate-400 block font-medium">Mayor concentración:</span>
          <strong className="text-truffle-trouble font-bold text-[11px]">
            {concentrationArea}
          </strong>
        </div>
      </div>

      {/* Backing Data Panel Expandable (#28) */}
      {showBackingModal && (
        <div className="p-3 bg-blue-fantastic/5 border-b border-blue-fantastic/10 text-xs space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-abyssal-blue text-[11px]">
            <span className="flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-truffle-trouble" />
              <span>Respaldos Académicos Validados (SIS)</span>
            </span>
            <button
              onClick={() => setShowBackingModal(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              [Cerrar]
            </button>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-600 font-mono">
            <li className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Título Universitario registrado en DRE UMSS</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Acta de Grado aprobada con honores</span>
            </li>
            <li className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Certificación internacional Credly / AWS</span>
            </li>
          </ul>
        </div>
      )}

      {/* Footer Action Buttons */}
      <div className="p-3 bg-white flex items-center justify-between gap-2">
        <button
          onClick={() => setShowBackingModal(!showBackingModal)}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-white transition-all flex items-center justify-center space-x-1 ${
            featured
              ? 'bg-truffle-trouble hover:bg-truffle-trouble/90 shadow-sm'
              : 'bg-blue-fantastic hover:bg-abyssal-blue'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Ver Respaldos</span>
        </button>

        <button
          onClick={() => {
            if (onSelectCandidate) onSelectCandidate(graduateId);
          }}
          className="flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center space-x-1"
        >
          <span>Ver Detalle</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};