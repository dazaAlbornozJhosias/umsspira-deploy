'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authStore, useAuthStore } from '@/modules/auth/frontend/store';
import { clearSession } from '@/modules/auth/frontend/services/session';
import { authenticatedFetch, revokeCurrentSession, SessionError } from '@/shared/services/auth-session';
import { Navbar } from './navbar';
import { NAVBAR_ROLE_LABEL } from './navigation';
import type { NavbarRole, NavbarSession } from './types';

const roles: NavbarRole[] = ['titulado', 'empresa', 'administrador'];

function sessionFromUser(value: unknown): NavbarSession | null {
  if (!value || typeof value !== 'object') return null;
  const user = value as { email?: unknown; role?: unknown };
  if (!roles.includes(user.role as NavbarRole)) return null;
  const role = user.role as NavbarRole;
  // El contrato actual de /me entrega email y rol, no un nombre completo.
  const name = typeof user.email === 'string' && user.email ? user.email.split('@')[0] : NAVBAR_ROLE_LABEL[role];
  const words = name.split(/[\s._-]+/).filter(Boolean);
  const initials = words.length > 1 ? `${words[0][0]}${words[1][0]}` : name.slice(0, 2);
  return { name, role, initials: initials.toUpperCase() };
}

/** Adaptador real. Nunca consume la sesión ficticia del laboratorio. */
export function ConnectedNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthStore();
  const [session, setSession] = useState<NavbarSession | null>(null);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    let request: AbortController | undefined;
    let disposed = false;
    const invalidateSession = () => {
      // HU-004 CA-05: un rechazo 401 no debe dejar el estado React autenticado.
      clearSession();
      authStore.reset();
      setSession(null);
      // El portal institucional público puede mostrarse sin sesión;
      // reportería, en cambio, requiere volver a /login.
      if (pathname === '/reports' || pathname?.startsWith('/reports/')) {
        router.replace('/login');
        router.refresh();
      }
    };
    const synchronize = async () => {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      try {
        const response = await authenticatedFetch('/api/v1/auth/me', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const body: { data?: unknown } = response.ok ? await response.json() : {};
        if (!disposed && !controller.signal.aborted) {
          if (response.status === 401) invalidateSession();
          else setSession(response.ok ? sessionFromUser(body.data) : null);
        }
      } catch (error) {
        if (!disposed && !controller.signal.aborted) {
          if (error instanceof SessionError && error.status === 401) invalidateSession();
          else setSession(null);
        }
      }
    };
    void synchronize();
    window.addEventListener('focus', synchronize);
    window.addEventListener('storage', synchronize);
    return () => {
      disposed = true;
      request?.abort();
      window.removeEventListener('focus', synchronize);
      window.removeEventListener('storage', synchronize);
    };
  }, [pathname, auth.accessToken, router]);

  const logout = async () => {
    setLogoutError(false);
    try {
      await revokeCurrentSession();
      clearSession();
      authStore.reset();
      setSession(null);
      // HU-004: el administrador regresa a la bienvenida institucional.
      router.push(session?.role === 'administrador' ? '/' : '/login');
      router.refresh();
    } catch { setLogoutError(true); }
  };

  return <><Navbar session={session} onLogout={logout} />{logoutError && <p role="alert">No se pudo cerrar la sesión. Inténtalo nuevamente.</p>}</>;
}
