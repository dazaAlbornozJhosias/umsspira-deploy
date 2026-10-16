'use client';

import React, { useState } from 'react';
import { NlpSearch, type SearchCandidateResult } from '@/shared/components/nlp-search';
import { CandidateCard } from '@/shared/components/candidate-card';
import { EvidenceBreakdown } from '@/shared/components/evidence-breakdown';
import { CandidatesEmptyState } from '@/shared/components/candidates-empty-state';
import { useCarouselPagination } from '@/shared/hooks/use-carousel-pagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// TODO: [Tarea #32] - Reemplazar este mock estático cuando se conecte el cálculo de afinidad real de la base de datos (Épica 2 / Épica 4)
import candidatesData from '@/shared/mocks/candidates-mock.json';

export const RecruiterCandidatesView: React.FC = () => {
  const [candidates, setCandidates] = useState<SearchCandidateResult[]>(
    candidatesData.candidates as SearchCandidateResult[]
  );
  const [selectedGraduateId, setSelectedGraduateId] = useState<string>(
    candidatesData.candidates[0]?.graduateId ?? ''
  );
  const [, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Hook de paginación del carrusel
  const { currentIndex, itemsPerPage, handlePrev, handleNext, resetPagination } =
    useCarouselPagination(candidates.length);

  // Con la lista vacía no hay candidato seleccionado: se muestra el estado vacío
  const selectedCandidate: SearchCandidateResult | undefined =
    candidates.find((c) => c.graduateId === selectedGraduateId) ?? candidates[0];

  // Ajustes: Reiniciar paginación a 0 y seleccionar el primer resultado del buscador
  const handleSearchCompleted = (results: SearchCandidateResult[], query: string) => {
    // TODO: [Tarea #32] - Aquí se inyectarán los resultados filtrados provenientes del backend
    setCandidates(results);
    setSearchQuery(query);
    resetPagination(); // Forzar el carrusel a volver a la página 1 (Índice 0)

    if (results.length > 0) {
      setSelectedGraduateId(results[0].graduateId); // Sincroniza el panel de evidencia con el primer resultado
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <section>
        <NlpSearch
          onSearchCompleted={handleSearchCompleted}
          isSearching={isSearching}
          setIsSearching={setIsSearching}
          totalCandidates={candidatesData.candidates.length}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300/60 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-truffle-trouble" />
              <h3 className="text-lg font-black text-abyssal-blue tracking-tight uppercase">
                Comparativa de Titulados & Hexágonos de Afinidad
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Selecciona un candidato para inspeccionar la trazabilidad de sus materias, actas de grado y diplomas.
            </p>
          </div>

          <div
            className={
              candidates.length > 0 ? 'flex items-center space-x-2 self-end sm:self-auto' : 'hidden'
            }
          >
            <span className="text-xs text-slate-500 font-mono mr-2">
              Mostrando {candidates.length > 0 ? currentIndex + 1 : 0} -{' '}
              {Math.min(currentIndex + itemsPerPage, candidates.length)} de {candidates.length} candidatos
            </span>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex + itemsPerPage >= candidates.length}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {candidates.length === 0 && <CandidatesEmptyState />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.slice(currentIndex, currentIndex + itemsPerPage).map((cand) => (
            <CandidateCard
              key={cand.graduateId}
              graduateId={cand.graduateId}
              name={cand.name}
              career={cand.career}
              graduationYear={cand.graduationYear}
              skills={cand.skills}
              professionalDescription={cand.professionalDescription}
              affinity={cand.affinity}
              nlpScore={cand.nlpScore}
              featured={cand.graduateId === candidates[0]?.graduateId}
              isSelected={selectedGraduateId === cand.graduateId}
              areas={cand.areas}
              location={cand.location}
              sisCode={cand.sisCode}
              concentrationArea={cand.concentrationArea}
              onSelectCandidate={(id) => setSelectedGraduateId(id)}
            />
          ))}
        </div>
      </section>

      <section id="evidence-section">
        {selectedCandidate && <EvidenceBreakdown candidateName={selectedCandidate.name} candidateData={selectedCandidate} />}
      </section>
    </div>
  );
};
