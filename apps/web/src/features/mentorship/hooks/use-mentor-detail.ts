'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SessionError } from '@/shared/services/auth-session';
import { getMentorDetail, MentorNotFoundError } from '../services/mentor-detail-api';
import type { MentorDetailProfile } from '../model/mentor-detail';

const TITLE_SUFFIX = ' | UMSSPIRA';

export interface UseMentorDetailResult {
  mentor: MentorDetailProfile | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  sessionRequired: boolean;
  retry: () => void;
}

export function useMentorDetail(mentorId: string): UseMentorDetailResult {
  const [mentor, setMentor] = useState<MentorDetailProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const requestRef = useRef<AbortController | null>(null);

  const executeFetch = useCallback(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);
    setError(null);
    setNotFound(false);
    setSessionRequired(false);

    if (typeof document !== 'undefined') {
      document.title = `Cargando perfil del mentor${TITLE_SUFFIX}`;
    }

    getMentorDetail(mentorId, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setMentor(data);
        if (typeof document !== 'undefined') {
          document.title = `Perfil del mentor: ${data.fullName}${TITLE_SUFFIX}`;
        }
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;

        if (reason instanceof MentorNotFoundError) {
          setNotFound(true);
          if (typeof document !== 'undefined') {
            document.title = `Perfil no disponible${TITLE_SUFFIX}`;
          }
          return;
        }

        if (reason instanceof SessionError && reason.status === 401) {
          setSessionRequired(true);
          setError(reason.message);
          if (typeof document !== 'undefined') {
            document.title = `Iniciar sesión${TITLE_SUFFIX}`;
          }
          return;
        }

        const message =
          reason instanceof Error
            ? reason.message
            : 'Ocurrió un problema al consultar el perfil del mentor. Revisa tu conexión e inténtalo nuevamente.';
        setError(message);
        if (typeof document !== 'undefined') {
          document.title = `Error al cargar perfil${TITLE_SUFFIX}`;
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
  }, [mentorId]);

  useEffect(() => {
    executeFetch();
    return () => {
      requestRef.current?.abort();
    };
  }, [executeFetch, attempt]);

  const retry = useCallback(() => {
    setAttempt((val) => val + 1);
  }, []);

  return {
    mentor,
    loading,
    error,
    notFound,
    sessionRequired,
    retry,
  };
}
