'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CalendarPlusIcon, InfoIcon, LoaderCircleIcon, UserRoundIcon } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from './mentor-button';
import {
  checkMentorshipRequestAccess,
  type DirectoryMentor,
  FORBIDDEN_MESSAGE,
  listMentorDirectory,
  MentorshipRequestError,
} from '../services/mentorship-request-api';

export function MentorDirectory() {
  const router = useRouter();
  const [mentors, setMentors] = useState<DirectoryMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessError, setAccessError] = useState('');
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const list = await listMentorDirectory(signal);
      if (!signal?.aborted) setMentors(list);
    } catch (reason) {
      if (signal?.aborted) return;
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el directorio de mentores.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function requestSession(mentorId: string) {
    if (checkingId) return;
    setAccessError('');
    setCheckingId(mentorId);
    try {
      if (!(await checkMentorshipRequestAccess())) {
        setAccessError(FORBIDDEN_MESSAGE);
        return;
      }
      router.push(`/mentorship/request/${mentorId}`);
    } catch (reason) {
      setAccessError(reason instanceof MentorshipRequestError || reason instanceof Error
        ? reason.message
        : FORBIDDEN_MESSAGE);
    } finally {
      setCheckingId(null);
    }
  }

  return (
    <section className="mentor-directory" aria-label="Directorio de mentores">
      {accessError && (
        <div className="mentor-request-alert" role="alert">
          <InfoIcon aria-hidden="true" />
          <p>{accessError}</p>
        </div>
      )}
      {error && (
        <div className="mentor-request-alert" role="alert">
          <p>{error}</p>
          <SecondaryButton onClick={() => void load()} disabled={loading}>Reintentar</SecondaryButton>
        </div>
      )}
      {loading && (
        <p className="mentor-request-loading" role="status">
          <LoaderCircleIcon aria-hidden="true" /> Cargando mentores…
        </p>
      )}
      {!loading && !error && mentors.length === 0 && (
        <p className="mentor-request-empty">Aún no hay mentores disponibles en el directorio.</p>
      )}
      {mentors.length > 0 && (
        <ul className="mentor-directory-list">
          {mentors.map((mentor) => {
            const enabled = mentor.availabilityStatus === 'AVAILABLE';
            return (
              <li key={mentor.id} className="mentor-directory-card">
                <span aria-hidden="true" className="mentor-directory-avatar"><UserRoundIcon /></span>
                <div className="mentor-directory-body">
                  <h2>{mentor.name}</h2>
                  {mentor.description && <p>{mentor.description}</p>}
                  {mentor.areas.length > 0 && (
                    <ul className="mentor-directory-areas" aria-label={`Áreas de ${mentor.name}`}>
                      {mentor.areas.map((area) => <li key={area.id}>{area.name}</li>)}
                    </ul>
                  )}
                  {!enabled && <p className="mentor-directory-paused">Este mentor pausó temporalmente nuevas solicitudes.</p>}
                </div>
                <PrimaryButton
                  iconRight={CalendarPlusIcon}
                  disabled={!enabled || checkingId !== null}
                  loading={checkingId === mentor.id}
                  loadingLabel="Verificando…"
                  onClick={() => void requestSession(mentor.id)}
                  aria-label={`Solicitar sesión con ${mentor.name}`}
                >
                  Solicitar sesión
                </PrimaryButton>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/mentorship" className="mentor-availability-back">
        <ArrowLeftIcon aria-hidden="true" /> Volver a Mentorías
      </Link>
    </section>
  );
}
