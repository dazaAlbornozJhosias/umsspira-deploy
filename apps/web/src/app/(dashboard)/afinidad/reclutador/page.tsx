'use client';

import React from 'react';
import { RecruiterCandidatesView } from '@/shared/components/recruiter-candidates-view';

/**
 * Página de Afinidad Profesional - Modo Buscador / Reclutador (Épica 4).
 * Comparativa de titulados, búsqueda semántica NLP y desglose de evidencia.
 */
export default function AffinityRecruiterPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <RecruiterCandidatesView />
    </main>
  );
}
