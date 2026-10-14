'use client';

import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

// Los 3 segundos dejan ver la confirmación sin tapar la interfaz más tiempo del necesario
export const TOAST_DURATION_MS = 3000;

export interface SuccessToastProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Confirmación flotante tras un recálculo exitoso.
 * Se cierra solo para no requerir una acción del usuario.
 */
export const SuccessToast: React.FC<SuccessToastProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => onClose(), TOAST_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-lg bg-abyssal-blue border border-oatmeal shadow-sm"
    >
      <CheckCircle2 className="w-4 h-4 text-burning-flame" />
      <span className="text-sm font-semibold text-white">Radar actualizado</span>
    </div>
  );
};
