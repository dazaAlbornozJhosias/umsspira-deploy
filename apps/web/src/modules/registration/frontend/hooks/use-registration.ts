'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRegistrationStore, type PersonalData } from '../store';
import { useEmailVerificationStore } from '@/modules/email-verification/frontend/store';
import {
  checkRegistrationSession,
  createRegistrationSession,
  fetchCareers,
  type Career,
  type CreateSessionResult,
} from '../services';
import type { PersonalDataValues } from '../validation/personal-data.schema';

export type SavedSessionStatus = 'none' | 'checking' | 'active' | 'expired';

/**
 * Logica del paso "Datos" del registro publico (HU-01):
 * carga el catalogo de carreras, revisa si hay un registro en curso (CA-01.6)
 * y envia los datos al backend para conservarlos 2 horas en Redis (CA-01.1).
 */
export function useRegistration() {
  const setSessionToken = useRegistrationStore((state) => state.setSessionToken);
  const setPersonalData = useRegistrationStore((state) => state.setPersonalData);
  const resetRegistration = useRegistrationStore((state) => state.reset);

  const [careers, setCareers] = useState<Career[]>([]);
  const [isLoadingCareers, setIsLoadingCareers] = useState(true);
  const [careersError, setCareersError] = useState<string | null>(null);

  const [savedSessionStatus, setSavedSessionStatus] = useState<SavedSessionStatus>('none');
  const [savedPersonalData, setSavedPersonalData] = useState<PersonalData | null>(null);
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    fetchCareers()
      .then((data) => {
        if (!isActive) return;
        setCareers(data);
        if (data.length === 0) {
          setCareersError('Aún no hay carreras registradas. Intenta nuevamente más tarde.');
        }
      })
      .catch(() => {
        if (isActive) setCareersError('No se pudieron cargar las carreras. Intenta nuevamente en unos minutos.');
      })
      .finally(() => {
        if (isActive) setIsLoadingCareers(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    // Se lee el estado ya restaurado del navegador despues de montar (evita diferencias con el servidor).
    const { sessionToken, personalData } = useRegistrationStore.getState();
    if (!sessionToken) return;

    let isActive = true;
    setSavedSessionStatus('checking');
    checkRegistrationSession(sessionToken).then((result) => {
      if (!isActive) return;
      if (result.status === 'active') {
        setSavedPersonalData(personalData);
        setSavedSessionStatus('active');
      } else if (result.status === 'expired') {
        resetRegistration();
        setExpiredMessage(result.message);
        setSavedSessionStatus('expired');
      } else {
        // Sin conexion: se conservan los datos y no se muestra ningun aviso.
        setSavedSessionStatus('none');
      }
    });
    return () => {
      isActive = false;
    };
  }, [resetRegistration]);

  const submitPersonalData = useCallback(
    async (values: PersonalDataValues): Promise<CreateSessionResult> => {
      const payload: PersonalData = { ...values, complementoCi: values.complementoCi ?? '' };
      const result = await createRegistrationSession({
        ...payload,
        // El backend trata el complemento vacio como ausente.
        complementoCi: payload.complementoCi || undefined,
      });
      if (result.ok) {
        setPersonalData(payload);
        setSessionToken(result.sessionToken);
        // Integra con HU-02: deja el correo y el token listos en la pantalla de verificación.
        useEmailVerificationStore.getState().setEmail(payload.correo);
        useEmailVerificationStore.getState().setSessionToken(result.sessionToken);
        setExpiredMessage(null);
      }
      return result;
    },
    [setPersonalData, setSessionToken],
  );

  return {
    careers,
    isLoadingCareers,
    careersError,
    savedSessionStatus,
    savedPersonalData,
    expiredMessage,
    submitPersonalData,
  };
}
