'use client';

import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/shared/services/auth-session';

export function useSurveyUserId(): string | undefined {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    void authenticatedFetch('/api/v1/auth/me', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!active || !response.ok) return;
        const body: unknown = await response.json();
        const user =
          typeof body === 'object' && body !== null && 'data' in body
            ? (body.data as { id?: unknown } | null)
            : null;
        if (typeof user?.id === 'string' && user.id) setUserId(user.id);
      })
      .catch(() => {
        /* sin sesión o sin red */
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return userId;
}