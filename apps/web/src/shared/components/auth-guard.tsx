'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAccessToken, SessionError } from '@/shared/services/auth-session';

/** Redirige a /login si no hay sesion vigente (HU-01 CA15/CA17, HU-02 CA8, HU-03 CA12, HU-05 CA18). */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void ensureAccessToken().then(() => { if (active) setAllowed(true); }).catch((error) => {
      if (!active) return;
      if (error instanceof SessionError && error.status === 401) router.replace('/login');
      else setError(true);
    });
    return () => { active = false; };
  }, [router]);

  return allowed ? <>{children}</> : error ? <p role="alert">No se pudo verificar la sesión. Inténtalo nuevamente.</p> : null;
}
