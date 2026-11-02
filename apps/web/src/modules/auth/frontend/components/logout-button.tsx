"use client";

import { authStore } from "../store";
import { clearSession } from "../services";
import { hardRedirect } from "../services/navigation";
import { useState } from 'react';
import { revokeCurrentSession } from '@/shared/services/auth-session';
import { clearAllSurveyDrafts } from '@/modules/surveys/frontend/hooks/use-survey-draft';

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleLogout() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await revokeCurrentSession();
      clearAllSurveyDrafts();
      clearSession();
      authStore.reset();
      hardRedirect("/login");
    } catch {
      setError('No se pudo cerrar la sesión. Inténtalo nuevamente.');
    } finally { setPending(false); }
  }

  return (
    <><button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="text-sm font-medium text-white/90 hover:text-white"
    >
      Cerrar sesión
    </button>{error && <p role="alert">{error}</p>}</>
  );
}
