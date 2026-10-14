'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasValidSession } from '@/shared/services/api-client';

/** Redirige a /login si no hay sesion vigente (HU-01 CA15/CA17, HU-02 CA8, HU-03 CA12, HU-05 CA18). */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (hasValidSession()) setAllowed(true);
    else router.replace('/login');
  }, [router]);

  return allowed ? <>{children}</> : null;
}