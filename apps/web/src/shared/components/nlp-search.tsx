'use client';

import React, { useState } from 'react';
import { Search, Cpu, RefreshCw } from 'lucide-react';
import type { RawAreaPoint } from '../utils/affinity-areas';
import { rankCandidatesByQuery } from '../utils/candidate-search';

export interface SearchCandidateResult {
  graduateId: string;
  name: string;
  career: string;
  graduationYear: number;
  skills: string[];
  professionalDescription: string;
  affinity: number;
  featured: boolean;
  nlpScore?: number;
  areas?: RawAreaPoint[];
  location?: string;
  sisCode?: string;
  concentrationArea?: string;
}

interface NlpSearchProps {
  onSearchCompleted: (results: SearchCandidateResult[], query: string) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
  totalCandidates?: number;
}

export const NlpSearch: React.FC<NlpSearchProps> = ({
  onSearchCompleted,
  isSearching,
  setIsSearching,
  totalCandidates = 0,
}) => {
  const [jobDescription, setJobDescription] = useState<string>(
    'Senior Full Stack, Cloud & Microservicios'
  );

  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsSearching(true);

    try {
      // TODO: [Épica 2 y cálculo de afinidad] - Sprint 1 simulado, sin backend: la búsqueda solo reordena
      // a los candidatos del mock según el porcentaje que tienen en las áreas mencionadas.
      // Cuando exista el backend, aquí se enviará `jobDescription` y se recibirá la lista ya filtrada.
      const mockData = await import('../mocks/candidates-mock.json');
      const candidates = mockData.default.candidates as SearchCandidateResult[];
      onSearchCompleted(rankCandidatesByQuery(candidates, jobDescription), jobDescription);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-abyssal-blue text-xs font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5 text-truffle-trouble" />
            <span>ALGORITMO DE COMPATIBILIDAD SIG-MATCH</span>
          </div>
          <h2 className="text-2xl font-black text-abyssal-blue tracking-tight uppercase">
            BUSCADOR DE TALENTO Y AFINIDAD PROFESIONAL
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Compara competencias de titulados de Sistemas e Informática mediante gráficos de afinidad y valida sus respaldos académicos y certificaciones oficiales.
          </p>
        </div>

        {/* Stats Pill Card */}
        <div className="bg-blue-fantastic/5 border border-blue-fantastic/10 p-3.5 rounded-xl flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-abyssal-blue text-burning-flame flex items-center justify-center font-black text-lg">
            {totalCandidates}
          </div>
          <div>
            <span className="text-xs font-bold text-abyssal-blue block">TITULADOS</span>
            <span className="text-[10px] text-slate-500">Con afinidad y SIS verificado</span>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleExecuteSearch} className="space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          Buscar por tecnología o habilidad (ej. React, Python, Cloud, Microservicios)
        </label>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Senior Full Stack, Cloud & Microservicios..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-burning-flame focus:border-burning-flame transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-7 py-2.5 bg-burning-flame hover:bg-burning-flame/90 active:bg-truffle-trouble text-abyssal-blue font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};