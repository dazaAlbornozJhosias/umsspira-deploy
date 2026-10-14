'use client';

import { useEffect, useRef, useState } from 'react';
import type { MentorState } from '@umsspira/shared-types';
import { getActivationEligibility } from '../model/activation-conditions';
import { getMentorProfile, updateMentorParticipation } from '../services/mentorship-api';

function errorMessage(error: unknown) {
  return error instanceof Error && error.name !== 'TypeError'
    ? error.message
    : 'No se pudo conectar con el backend. Comprueba la conexión y vuelve a intentar.';
}

export function useMentorParticipation() {
  const [profile, setProfile] = useState<MentorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const mounted = useRef(false);
  const mutation = useRef<AbortController | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    setLoading(true);
    setProfile(null);
    setError('');
    getMentorProfile(controller.signal)
      .then(data => { if (!controller.signal.aborted) setProfile(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(errorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => {
      mounted.current = false;
      controller.abort();
      mutation.current?.abort();
    };
  }, [reloadKey]);

  async function changeParticipation(active: boolean): Promise<boolean> {
    if (!profile || savingRef.current || (active && !getActivationEligibility(profile.requirements).eligible)) return false;
    savingRef.current = true;
    setSaving(true);
    setError('');
    const controller = new AbortController();
    mutation.current = controller;
    try {
      const updated = await updateMentorParticipation(active, controller.signal);
      if (!mounted.current || controller.signal.aborted) return false;
      setProfile(updated);
      return true;
    } catch (reason) {
      if (mounted.current && !controller.signal.aborted) setError(errorMessage(reason));
      return false;
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return { profile, loading, saving, error, changeParticipation, retry: () => setReloadKey(key => key + 1) };
}
