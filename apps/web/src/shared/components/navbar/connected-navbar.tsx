'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authStore, useAuthStore } from '@/modules/auth/frontend/store';
import { clearSession } from '@/modules/auth/frontend/services/session';
import { notifySessionExpired } from '@/modules/auth/frontend/services/session-expired';
import { authenticatedFetch, revokeCurrentSession, SessionError } from '@/shared/services/auth-session';
import { Navbar } from './navbar';
import { NAVBAR_ROLE_LABEL } from './navigation';
import type { NavbarRole, NavbarSession } from './types';
import { clearAllSurveyDrafts } from '@/modules/surveys/frontend/hooks/use-survey-draft';

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

// Última sesión conocida: sobrevive a los cambios de página (el componente se vuelve a montar)
// para que la barra de visitante nunca parpadee mientras se revalida la sesión.
let cachedSession: NavbarSession | null | undefined;

/** Solo para pruebas: olvida la última sesión conocida. */
export function resetConnectedNavbarCache() { cachedSession = undefined; }

/** Adaptador real. Nunca consume la sesión ficticia del laboratorio. */
export function ConnectedNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthStore();
  // undefined = todavía no se sabe (no se muestra ninguna barra de cuenta ni de visitante)
  const [session, setSessionState] = useState<NavbarSession | null | undefined>(cachedSession);
  const [logoutError, setLogoutError] = useState(false);
  // HU-004 CA-07: durante el cierre voluntario, el 401 de /me no debe redirigir por su cuenta.
  const loggingOut = useRef(false);

  const setSession = useCallback((value: NavbarSession | null) => {
    cachedSession = value;
    setSessionState(value);
  }, []);

  // Un fallo que no es 401/403 (red, 500) conserva la sesión que ya se tenía.
  const keepOrGuest = useCallback(() => {
    setSessionState(previous => {
      const next = previous === undefined ? null : previous;
      cachedSession = next;
      return next;
    });
  }, []);

  useEffect(() => {
    let request: AbortController | undefined;
    let disposed = false;
    const invalidateSession = () => {
      if (loggingOut.current) return;
      // HU-004 CA-05: un rechazo 401/403 no debe dejar el estado React autenticado.
      clearSession();
      authStore.reset();
      setSession(null);
      // El portal institucional público puede mostrarse sin sesión;
      // reportería, en cambio, avisa con una ventana de alerta y vuelve a /login (CA-06).
      if (pathname === '/reports' || pathname?.startsWith('/reports/')) {
        notifySessionExpired();
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
          if (response.status === 401 || response.status === 403) invalidateSession();
          else if (response.ok) setSession(sessionFromUser(body.data));
          else keepOrGuest();
        }
      } catch (error) {
        if (!disposed && !controller.signal.aborted) {
          if (error instanceof SessionError && (error.status === 401 || error.status === 403)) invalidateSession();
          else keepOrGuest();
        }
      }
    };
    void synchronize();
    window.addEventListener('focus', synchronize);
    window.addEventListener('storage', synchronize);
    window.addEventListener('online', synchronize);
    return () => {
      disposed = true;
      request?.abort();
      window.removeEventListener('focus', synchronize);
      window.removeEventListener('storage', synchronize);
      window.removeEventListener('online', synchronize);
    };
  }, [pathname, auth.accessToken, router, setSession, keepOrGuest]);

  const logout = async () => {
    loggingOut.current = true;
    setLogoutError(false);
    try {
      await revokeCurrentSession();
      clearAllSurveyDrafts();
      clearSession();
      authStore.reset();
      setSession(null);
      // HU-004: el administrador regresa a la bienvenida institucional.
      router.push(session?.role === 'administrador' ? '/' : '/login');
      router.refresh();
    } catch {
      loggingOut.current = false;
      setLogoutError(true);
    }
  };

  // /portal/institucional es la portada pública: siempre muestra la barra de visitante
  // (Iniciar sesión / Registro). La barra por rol solo se ve en el resto del portal.
  const isPublicLanding = pathname === '/portal/institucional' || pathname?.startsWith('/portal/institucional/');

  return <><Navbar session={isPublicLanding ? null : (session ?? null)} loading={!isPublicLanding && session === undefined} onLogout={logout} />{logoutError && <p role="alert">No se pudo cerrar la sesión. Inténtalo nuevamente.</p>}</>;
}