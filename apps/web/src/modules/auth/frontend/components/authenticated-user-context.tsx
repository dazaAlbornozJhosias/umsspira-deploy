'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserRole } from '../services/auth.service';
import { authenticatedFetch, SessionError } from '@/shared/services/auth-session';

const AuthenticatedUserContext = createContext<string | null>(null);
const AuthenticatedUserRoleContext = createContext<UserRole | null>(null);

type SessionState =
  | { status: 'loading' }
  | { status: 'authenticated'; userId: string; role: UserRole }
  | { status: 'unauthenticated' }
  | { status: 'error' };

const ADMIN_EVENT_PATH = /^\/events(?:\/create|\/drafts(?:\/[^/]+)?|\/[^/]+(?:\/participants)?)?\/?$/;

function requiresAdminEventIdentity(pathname: string): boolean {
  return ADMIN_EVENT_PATH.test(pathname) && !pathname.startsWith('/events/catalog');
}

export function AuthenticatedUserProvider({
  userId,
  role,
  children,
}: {
  userId: string;
  role?: UserRole;
  children: ReactNode;
}) {
  return (
    <AuthenticatedUserRoleContext.Provider value={role ?? null}>
      <AuthenticatedUserContext.Provider value={userId}>
        {children}
      </AuthenticatedUserContext.Provider>
    </AuthenticatedUserRoleContext.Provider>
  );
}

export function AuthenticatedUserSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const requiresIdentity = requiresAdminEventIdentity(pathname);
  const [session, setSession] = useState<SessionState>({ status: 'loading' });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!requiresIdentity) {
      setSession({ status: 'unauthenticated' });
      return;
    }

    let isActive = true;
    const controller = new AbortController();
    setSession({ status: 'loading' });
    void authenticatedFetch('/api/v1/auth/me', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!isActive) return;
        if (!response.ok) {
          setSession(response.status === 401
            ? { status: 'unauthenticated' }
            : { status: 'error' });
          return;
        }

        const body: unknown = await response.json();
        const user = (
          typeof body === 'object' && body !== null && 'data' in body
            ? body.data
            : null
        ) as { id?: unknown; role?: unknown } | null;
        if (
          typeof user?.id !== 'string' ||
          !user.id ||
          user.role !== 'administrador'
        ) {
          if (isActive) setSession({ status: 'unauthenticated' });
          return;
        }

        setSession({
          status: 'authenticated',
          userId: user.id,
          role: 'administrador',
        });
      })
      .catch((error) => {
        if (isActive && !controller.signal.aborted) {
          setSession(error instanceof SessionError && error.status === 401
            ? { status: 'unauthenticated' } : { status: 'error' });
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [requiresIdentity, retryCount]);

  if (requiresIdentity && session.status !== 'authenticated') {
    return (
      <main className="mx-auto flex min-h-[40vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
        {session.status === 'loading' ? (
          <p role="status">Verificando la sesión administrativa…</p>
        ) : session.status === 'unauthenticated' ? (
          <>
            <p role="alert">Inicia sesión como administrador para gestionar eventos.</p>
            <Link className="underline" href="/login">Ir al inicio de sesión</Link>
          </>
        ) : (
          <>
            <p role="alert">No se pudo verificar la sesión. Comprueba tu conexión e inténtalo de nuevo.</p>
            <button
              type="button"
              className="underline"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Reintentar
            </button>
          </>
        )}
      </main>
    );
  }

  return (
    <AuthenticatedUserRoleContext.Provider
      value={session.status === 'authenticated' ? session.role : null}
    >
      <AuthenticatedUserContext.Provider
        value={session.status === 'authenticated' ? session.userId : null}
      >
        {children}
      </AuthenticatedUserContext.Provider>
    </AuthenticatedUserRoleContext.Provider>
  );
}

export function useAuthenticatedUserId(): string | undefined {
  return useContext(AuthenticatedUserContext) ?? undefined;
}

export function useAuthenticatedUserRole(): UserRole | undefined {
  return useContext(AuthenticatedUserRoleContext) ?? undefined;
}
