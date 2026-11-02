'use client';

import React, { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';
import { calculateVariation, formatVariation } from '../utils/affinity-variation';

export interface VariationIndicatorProps {
  /** Afinidad actual del eje, en porcentaje con decimales o ya redondeada. */
  current: number | null;
  /** Afinidad del cálculo anterior; null en el primer cálculo. */
  previous: number | null;
  /** Etiqueta larga del área, usada solo para el texto accesible. */
  areaLabel: string;
}

const BASE_CLASSES =
  'inline-flex items-center gap-1 rounded-full border border-oatmeal bg-palladian px-3 py-1.5 text-xs font-medium leading-none motion-safe:transition-opacity motion-safe:duration-150 motion-reduce:opacity-100';

/**
 * Indicador de variación de afinidad de un eje.
 *
 * SOLO se usa en escritorio. No renderiza nada cuando no hay cálculo anterior
 * o cuando la variación redondeada es cero (CA3). El color nunca es el único
 * canal: el signo, la flecha y el aria-label comunican la dirección.
 */
export const VariationIndicator: React.FC<VariationIndicatorProps> = ({
  current,
  previous,
  areaLabel,
}) => {
  const variation = calculateVariation(current, previous);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (variation === null) return null;

  const isIncrease = variation > 0;
  const Icon = isIncrease ? TrendingUp : TrendingDown;
  const pointsText = Math.abs(variation) === 1 ? 'punto porcentual' : 'puntos porcentuales';

  return (
    <span
      role="img"
      aria-label={`${areaLabel}: ${isIncrease ? 'subió' : 'bajó'} ${Math.abs(variation)} ${pointsText} respecto al cálculo anterior`}
      className={cn(
        BASE_CLASSES,
        isIncrease ? 'text-[#237044]' : 'text-truffle-trouble',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
      <span>{formatVariation(variation)}</span>
    </span>
  );
};
