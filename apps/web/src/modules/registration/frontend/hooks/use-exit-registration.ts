'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmailVerificationStore } from '@/modules/email-verification/frontend/store';
import { useRegistrationStore } from '../store';

export const EXIT_REGISTRATION_PATH = '/login';

// Hay información si ya existe una sesión, datos, documento o correo verificado.
function hasStoredRegistrationData(): boolean {
  const { sessionToken, personalData, document, verifiedEmail } = useRegistrationStore.getState();
  return Boolean(sessionToken || personalData || document || verifiedEmail);
}

// Borra el borrador temporal del registro y el de la verificación de correo.
function clearRegistrationDraft() {
  useRegistrationStore.getState().reset();
  const verification = useEmailVerificationStore.getState();
  verification.setSessionToken(null);
  verification.setEmail('');
  verification.reset();
}

export function useExitRegistration(hasUnsavedInput = false) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Alerta nativa solo si hay texto escrito sin enviar, porque lo demás se conserva al recargar.
  useEffect(() => {
    if (!hasUnsavedInput) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedInput]);

  const requestExit = useCallback(() => {
    if (hasUnsavedInput || hasStoredRegistrationData()) {
      setIsDialogOpen(true);
      return;
    }
    router.push(EXIT_REGISTRATION_PATH);
  }, [hasUnsavedInput, router]);

  const confirmExit = useCallback(() => {
    clearRegistrationDraft();
    setIsDialogOpen(false);
    router.push(EXIT_REGISTRATION_PATH);
  }, [router]);

  const cancelExit = useCallback(() => setIsDialogOpen(false), []);

  return { isDialogOpen, requestExit, confirmExit, cancelExit };
}
