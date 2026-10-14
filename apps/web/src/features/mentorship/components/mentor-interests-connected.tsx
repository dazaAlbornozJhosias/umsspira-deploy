'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MentorState } from '@umsspira/shared-types';
import { getMentorProfile } from '../services/mentorship-api';
import { getMentorInterests, saveMentorInterests, type MentorInterestsState } from '../services/mentor-interests-api';
import { MentorInterests } from './mentor-interests';
import { SecondaryButton } from './mentor-button';

export function MentorInterestsConnected() {
  const [state, setState] = useState<MentorInterestsState | null>(null);
  const [profile, setProfile] = useState<MentorState | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setState(null);
    setProfile(null);
    Promise.all([getMentorInterests(controller.signal), getMentorProfile(controller.signal)])
      .then(([data, mentor]) => {
        if (!controller.signal.aborted) { setState(data); setProfile(mentor); }
      })
      .catch(reason => {
        if (!controller.signal.aborted) setError(reason instanceof Error && reason.name !== 'TypeError'
          ? reason.message : 'No se pudo conectar con el backend. Vuelve a intentar.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  if (loading) return <p role="status">Cargando tus intereses de mentoría…</p>;
  if (error) return <div role="alert" className="mentor-api-error"><p>{error}</p><SecondaryButton onClick={() => setAttempt(value => value + 1)}>Reintentar</SecondaryButton>{' '}<Link href="/mentorship/profile">Volver a mi perfil</Link></div>;
  if (!state || !profile) return null;
  if (!profile.isActive || !profile.requirements.egresado) return <section className="interests-summary"><p>Para configurar intereses debes tener tu participación activa y cumplir los requisitos de mentor.</p><Link href="/mentorship/profile" className="mentor-button mentor-button-secondary">Revisar mi participación</Link></section>;
  return <MentorInterests key={attempt} catalog={state.catalog} initialConfiguration={state.configuration}
    profile={profile} minimumAreas={1} onSave={saveMentorInterests} />;
}
