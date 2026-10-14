'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface RecalculateButtonProps {
  hasPendingChanges: boolean;
  isLoading: boolean;
  onRecalculate: () => void;
}

/**
 * Botón compacto de recálculo junto al gráfico.
 * Solo muestra el disparador: el aviso de cambios vive en el diálogo emergente
 * y el error se muestra sobre el radar.
 */
export const RecalculateButton: React.FC<RecalculateButtonProps> = ({
  hasPendingChanges,
  isLoading,
  onRecalculate,
}) => {
  const isDisabled = !hasPendingChanges || isLoading;

  return (
    <button
      type="button"
      onClick={onRecalculate}
      disabled={isDisabled}
      className={`inline-flex items-center space-x-1.5 px-4 h-11 rounded-lg text-sm font-semibold transition-colors ${
        hasPendingChanges
          ? 'bg-burning-flame hover:bg-burning-flame/90 text-abyssal-blue disabled:opacity-50'
          : 'bg-palladian text-blue-fantastic/50 cursor-not-allowed'
      }`}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      <span>{isLoading ? 'Recalculando...' : 'Recalcular'}</span>
    </button>
  );
};
