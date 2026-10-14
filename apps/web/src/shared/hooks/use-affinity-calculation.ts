import { useState, useCallback } from 'react';
import type { AffinityVectorResponse } from '@umsspira/shared-types/src/affinity';
import { calculateAffinityVector } from '../services/affinity-service';

/**
 * Interfaz que representa el estado y métodos retornados por el hook useAffinityCalculation.
 */
export interface UseAffinityCalculationReturn {
  /** Resultado del vector de afinidad o null si no se ha calculado */
  data: AffinityVectorResponse | null;
  /** Indica si la solicitud de cálculo se encuentra en progreso */
  isLoading: boolean;
  /** Mensaje de error en caso de fallo o null si la operación fue exitosa */
  error: string | null;
  /** Función para iniciar la solicitud de cálculo del vector de afinidad */
  calculate: () => Promise<void>;
  /** Función para reintentar la solicitud de cálculo */
  retry: () => Promise<void>;
  /** Función para restablecer el estado inicial */
  reset: () => void;
}

/**
 * Hook personalizado de React para gestionar el estado del cálculo del vector de afinidad,
 * incluyendo los estados de carga, manejo de errores y reintento.
 *
 * @returns Objeto con los datos del vector de afinidad, estado de carga, error y funciones de control.
 */
export function useAffinityCalculation(): UseAffinityCalculationReturn {
  const [data, setData] = useState<AffinityVectorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await calculateAffinityVector();
      setData(response);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ocurrió un error inesperado al calcular la afinidad.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(async () => {
    await calculate();
  }, [calculate]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    calculate,
    retry,
    reset,
  };
}
