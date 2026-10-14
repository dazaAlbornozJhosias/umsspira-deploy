import React from 'react';
import { clampPercentage, formatPercentage } from '../utils/percentage';

export interface ProgressBarProps {
  value: number | null | undefined;
  label?: string;
  showText?: boolean;
  className?: string;
}

/**
 * Componente para mostrar barras de porcentaje/progreso.
 * Aplica redondeo e intervalo [0, 100] en JS y clamp visual CSS como resguardo adicional.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showText = true,
  className = '',
}) => {
  const clampedValue = clampPercentage(value);
  const formattedText = formatPercentage(value);

  return (
    <div className={`w-full ${className}`}>
      {(label || showText) && (
        <div className="flex justify-between items-center mb-1 text-sm font-medium text-gray-700">
          {label && <span>{label}</span>}
          {showText && <span className="font-semibold text-gray-900">{formattedText}</span>}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{
            // Resguardo de clamp visual en CSS (garantiza renderizado entre 0% y 100%)
            width: `clamp(0%, ${clampedValue}%, 100%)`,
          }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
