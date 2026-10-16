'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authStore, useAuthStore } from '@/modules/auth/frontend/store';
import { clearSession, getSessionToken } from '@/modules/auth/frontend/services/session';
import { clearAccessToken, getAccessToken } from '@/shared/services/auth-session';
import { clearToken, getToken } from '@/shared/services/api-client';
import { Navbar } from './navbar';
import { NAVBAR_ROLE_LABEL } from './navigation';
import type { NavbarRole, NavbarSession } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
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

  useEffect(() => {
    let request: AbortController | undefined;
    let disposed = false;
    const synchronize = async () => {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      const token = getSessionToken() ?? getAccessToken() ?? getToken();
      if (!token) { setSession(null); return; }
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          cache: 'no-store',
        });
        const body: { data?: unknown } = response.ok ? await response.json() : {};
        if (!disposed && !controller.signal.aborted) setSession(response.ok ? sessionFromUser(body.data) : null);
      } catch {
        if (!disposed && !controller.signal.aborted) setSession(null);
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
  }, [pathname, auth.accessToken]);

  const logout = () => {
    clearSession();
    clearAccessToken();
    clearToken();
    authStore.reset();
    setSession(null);
    router.push('/login');
    router.refresh();
  };

  return <Navbar session={session} onLogout={logout} />;
}
