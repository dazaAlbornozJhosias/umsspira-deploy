import React from 'react';
import { Users } from 'lucide-react';

/**
 * Estado vacío del carrusel del reclutador (HU-4, CA10).
 * Se muestra cuando no hay candidatos y reemplaza al contador de rangos.
 */
export const CandidatesEmptyState: React.FC = () => {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-slate-500"
    >
      <Users className="w-8 h-8" aria-hidden="true" />
      <p className="text-sm font-semibold">No hay candidatos disponibles</p>
    </div>
  );
};