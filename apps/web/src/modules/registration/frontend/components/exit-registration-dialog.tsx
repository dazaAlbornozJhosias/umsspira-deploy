'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/shared/components/button';

interface ExitRegistrationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitRegistrationDialog({ isOpen, onConfirm, onCancel }: ExitRegistrationDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Al abrirse, el foco va a la opción segura (conservar los datos).
  useEffect(() => {
    if (isOpen) cancelButtonRef.current?.focus();
  }, [isOpen]);

  // Escape equivale a cancelar: no se pierde nada.
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-abyssal-blue/60 px-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-registration-title"
        aria-describedby="exit-registration-description"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[420px] rounded-2xl border border-oatmeal bg-white p-6 shadow-xl sm:p-8"
      >
        <h2 id="exit-registration-title" className="text-lg font-semibold leading-6 text-abyssal-blue sm:text-2xl sm:leading-8">
          ¿Salir del registro?
        </h2>
        <p id="exit-registration-description" className="mt-2 text-[13px] text-abyssal-blue/80 sm:text-sm">
          Se perderán los datos ingresados.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button ref={cancelButtonRef} type="button" variant="secondary" onClick={onCancel}>
            Seguir en el registro
          </Button>
          <Button type="button" onClick={onConfirm}>
            Salir
          </Button>
        </div>
      </div>
    </div>
  );
}
