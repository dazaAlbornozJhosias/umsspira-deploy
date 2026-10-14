'use client';

import React from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';

export interface RadarErrorStateProps {
  onRetry: () => void;
  isRetrying: boolean;
}

/**
 * Estado de error dentro de la tarjeta del gráfico.
 *
 * Vive sobre el radar en lugar de en un modal para que el usuario siga viendo
 * su último radar y pueda reintentar sin salir de la vista.
 */
export const RadarErrorState: React.FC<RadarErrorStateProps> = ({ onRetry, isRetrying }) => {
  return (
    <div
      role="alert"
      className="flex flex-col items-center text-center gap-3 p-6 w-full max-w-xs rounded-2xl border border-dashed border-oatmeal bg-palladian/70"
    >
      <div className="p-3 rounded-lg bg-white border border-oatmeal">
        <BarChart3 className="w-5 h-5 text-truffle-trouble" />
      </div>

      <h4 className="text-base font-semibold text-abyssal-blue">Error</h4>
      <p className="text-xs font-medium text-truffle-trouble">
        No se pudo actualizar tu radar
      </p>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center space-x-1.5 h-11 px-4 rounded-lg bg-burning-flame text-abyssal-blue text-sm font-bold hover:bg-burning-flame/90 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>Reintentar</span>
      </button>
    </div>
  );
};
