import { useState, useCallback } from 'react';

export interface UseRecalculateStateReturn {
  hasPendingChanges: boolean;
  markPendingChanges: () => void;
  clearPendingChanges: () => void;
}

/**
 * Hook que gestiona el estado de cambios pendientes de recálculo.
 *
 * hasPendingChanges se mantiene en true hasta que el recálculo termina
 * correctamente. Si el recálculo falla, el estado se conserva para permitir
 * al usuario reintentar sin perder la indicación de que hay cambios sin aplicar.
 */
export function useRecalculateState(): UseRecalculateStateReturn {
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);

  const markPendingChanges = useCallback(() => {
    setHasPendingChanges(true);
  }, []);

  const clearPendingChanges = useCallback(() => {
    setHasPendingChanges(false);
  }, []);

  return {
    hasPendingChanges,
    markPendingChanges,
    clearPendingChanges,
  };
}
