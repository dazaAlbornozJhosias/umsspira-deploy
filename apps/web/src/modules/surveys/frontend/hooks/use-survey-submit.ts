'use client';

import { useCallback, useRef, useState } from 'react';
import { ApiError } from '@/shared/services/api-client';
import {
  submitSurvey,
  SURVEY_SENT_MESSAGE,
  SURVEY_SEND_ERROR_MESSAGE,
  type SurveySubmitInput,
} from '../services/surveys.service';

export type SurveySubmitStatus = 'idle' | 'success' | 'error';
export type SurveySubmitErrorKind = 'connection' | 'http' | null;

/**
 * T3.4 — El hook NO administra ni limpia las respuestas del formulario:
 * el dueño del estado será T1.2. Un fallo permite reintentar con los mismos
 * datos. El manejo explícito de banner offline corresponde a T3.6.
 */
export function useSurveySubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SurveySubmitStatus>('idle');
  const [errorKind, setErrorKind] = useState<SurveySubmitErrorKind>(null);
  const inFlight = useRef(false);

  const submit = useCallback(async (values: SurveySubmitInput): Promise<boolean> => {
    // Ref inmediata para impedir doble envío incluso entre dos clicks del mismo render.
    if (inFlight.current) return false;
    inFlight.current = true;
    setIsSubmitting(true);
    setStatus('idle');
    setErrorKind(null);
    try {
      await submitSurvey(values);
      setStatus('success');
      return true;
    } catch (error) {
      setErrorKind(error instanceof ApiError && error.status === 0 ? 'connection' : 'http');
      setStatus('error');
      return false;
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }, []);

  /** Consumir cuando el usuario modifica respuestas; no toca el formulario. */
  const resetFeedback = useCallback(() => {
    setStatus('idle');
    setErrorKind(null);
  }, []);

  return {
    isSubmitting,
    status,
    errorKind,
    message: status === 'success'
      ? SURVEY_SENT_MESSAGE
      : status === 'error' ? SURVEY_SEND_ERROR_MESSAGE : null,
    submit,
    resetFeedback,
  };
}
