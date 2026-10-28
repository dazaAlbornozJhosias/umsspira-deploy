import type { AffinityArea } from '@umsspira/shared-types';
import type { AffinityAreaScore } from '@umsspira/shared-types';

// Define el tipo básico que usarás, basado en el contrato de la API

/**
 * Calcula la variación entre el porcentaje actual y el anterior.
 * Devuelve un string con formato (+8%, -3%) o undefined si es 0 o es el primer cálculo.
 */
export const calculateAffinityVariation = (current: number, previous?: number): string | undefined => {
  if (previous === undefined) return undefined; // Primer cálculo, sin historial

  // Aseguramos que los valores sean enteros, como dice el ajuste de QA
  const currentInt = Math.round(current);
  const previousInt = Math.round(previous);

  const difference = currentInt - previousInt;

  if (difference === 0) return undefined; // Sin cambio, no se muestra indicador

  if (difference > 0) return `+${difference}%`;
  return `${difference}%`; // El signo negativo ya viene incluido si es menor a 0
};

/**
 * Ordena el array de áreas de mayor a menor afinidad.
 * Se usará para el panel "Áreas con mayor afinidad identificadas".
 */
export const sortAreasByAffinityDesc = (areas: AffinityAreaScore[]): AffinityAreaScore[] => {
  // Usamos [...areas] para no mutar el array original (buena práctica en React)
  return [...areas].sort((a, b) => {
    // Si la afinidad es igual, podríamos desempatar por nombre, pero el principal es el porcentaje
    return b.affinity - a.affinity;
  });
};
