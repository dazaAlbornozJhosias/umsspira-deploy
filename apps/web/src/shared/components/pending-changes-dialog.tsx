'use client';

import React, { useEffect, useRef } from 'react';

export interface PendingChangesDialogProps {
  open: boolean;
  onRecalculate: () => void;
  onDismiss: () => void;
}

/**
 * Aviso emergente de cambios pendientes.
 *
 * "Ahora no" solo oculta el diálogo: los cambios siguen pendientes para que el
 * usuario pueda recalcular más tarde desde el botón de la tarjeta.
 */
export const PendingChangesDialog: React.FC<PendingChangesDialogProps> = ({
  open,
  onRecalculate,
  onDismiss,
}) => {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // El foco inicial va al botón primario para que Enter dispare el recálculo
    primaryButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-abyssal-blue/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pending-changes-title"
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-oatmeal"
      >
        <h2 id="pending-changes-title" className="text-base font-bold text-abyssal-blue">
          Se detectaron modificaciones
        </h2>
        <p className="text-sm text-blue-fantastic mt-2">
          Actualiza tu información para recalcular tu radar de afinidad.
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="h-11 px-4 rounded-lg border border-oatmeal bg-white text-blue-fantastic text-sm font-semibold hover:bg-palladian transition-colors"
          >
            Ahora no
          </button>
          <button
            ref={primaryButtonRef}
            type="button"
            onClick={onRecalculate}
            className="h-11 px-4 rounded-lg bg-burning-flame text-abyssal-blue text-sm font-semibold hover:bg-burning-flame/90 transition-colors"
          >
            Recalcular
          </button>
        </div>
      </div>
    </div>
  );
};
