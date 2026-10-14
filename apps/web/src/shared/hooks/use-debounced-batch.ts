import { useRef, useCallback, useEffect, useState } from 'react';

export const DEBOUNCE_MS = 2000;

export interface UseDebouncedBatchReturn<T> {
  add: (item: T) => void;
  flush: () => Promise<void>;
  hasPending: boolean;
}

/**
 * Hook que agrupa múltiples guardados próximos en el tiempo y los envía
 * en una única petición tras una ventana de debounce.
 *
 * Utiliza refs para la cola de items, el timer y la petición en vuelo porque
 * no necesitan provocar re-renders: la cola se lee solo al ejecutar flush,
 * el timer se gestiona internamente con clearTimeout/setTimeout, y la petición
 * en vuelo se espera con un bucle de await para evitar condiciones de carrera.
 *
 * flush() envía inmediatamente los cambios pendientes sin esperar al
 * debounce. Se usa antes de recalcular para asegurar que el servidor
 * tiene la última configuración.
 *
 * inFlightRef protege contra dos flush concurrentes: si el timer ya disparó
 * un guardado y el usuario presiona Recalcular, el recálculo espera a que
 * el guardado termine antes de continuar.
 *
 * Si onBatch falla, el lote se devuelve al inicio de la cola para no perder
 * los cambios. El error se relanza para que el llamador pueda manejarlo.
 */
export function useDebouncedBatch<T>(
  onBatch: (items: T[]) => Promise<void>,
  debounceMs: number = DEBOUNCE_MS,
): UseDebouncedBatchReturn<T> {
  const itemsRef = useRef<T[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBatchRef = useRef(onBatch);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const [hasPending, setHasPending] = useState<boolean>(false);

  useEffect(() => {
    onBatchRef.current = onBatch;
  }, [onBatch]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    clearTimer();

    while (inFlightRef.current !== null) {
      try {
        await inFlightRef.current;
      } catch {
        // El error ya fue manejado por el flush que lo lanzó
      }
    }

    if (itemsRef.current.length === 0) {
      return;
    }

    const batch = [...itemsRef.current];
    itemsRef.current = [];
    setHasPending(false);

    const promise = onBatchRef.current(batch)
      .catch((err) => {
        itemsRef.current = [...batch, ...itemsRef.current];
        setHasPending(true);
        throw err;
      })
      .finally(() => {
        inFlightRef.current = null;
      });

    inFlightRef.current = promise;
    await promise;
  }, [clearTimer]);

  const add = useCallback(
    (item: T) => {
      itemsRef.current.push(item);
      setHasPending(true);
      clearTimer();
      timerRef.current = setTimeout(() => {
        flush().catch(() => undefined);
      }, debounceMs);
    },
    [clearTimer, flush, debounceMs],
  );

  useEffect(() => {
    return () => {
      clearTimer();
      if (itemsRef.current.length > 0) {
        flush().catch(() => undefined);
      }
    };
  }, [clearTimer, flush]);

  return { add, flush, hasPending };
}
