import { useState, useCallback } from 'react';

export const PENDING_PROFILE_CHANGES_STORAGE_KEY =
  'umsspira:affinity:pending-profile-changes';

export function markPendingProfileChanges(): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(PENDING_PROFILE_CHANGES_STORAGE_KEY, 'true');
    }
  } catch {
    // Ignorar errores de almacenamiento en entornos restringidos
  }
}

export function hasPendingProfileChanges(): boolean {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return (
        window.sessionStorage.getItem(PENDING_PROFILE_CHANGES_STORAGE_KEY) ===
        'true'
      );
    }
  } catch {
    // Ignorar errores de almacenamiento en entornos restringidos
  }
  return false;
}

export function clearPendingProfileChanges(): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(PENDING_PROFILE_CHANGES_STORAGE_KEY);
    }
  } catch {
    // Ignorar errores de almacenamiento en entornos restringidos
  }
}

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
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(() =>
    hasPendingProfileChanges()
  );

  const markPendingChanges = useCallback(() => {
    setHasPendingChanges(true);
  }, []);

  const clearPendingChanges = useCallback(() => {
    clearPendingProfileChanges();
    setHasPendingChanges(false);
  }, []);

  return {
    hasPendingChanges,
    markPendingChanges,
    clearPendingChanges,
  };
}