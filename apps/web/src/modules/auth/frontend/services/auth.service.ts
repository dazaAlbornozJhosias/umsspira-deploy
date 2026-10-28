import type { UserRole } from '@umsspira/shared-types';
import { apiFetch } from '@/shared/services/api-client';
export type { UserRole };

export interface LoginCredentials { email: string; password: string; remember?: boolean; }
export interface LoginResult { accessToken: string; role: UserRole; }
export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  permissions: string[];
  scopes: { companyIds: string[]; graduateId: string | null; careerIds: string[] };
}

export function getCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/api/v1/auth/me');
}
export const LOGIN_ERROR_MESSAGE = 'Correo electrónico o contraseña incorrectos';

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    throw new Error(response.status === 429 ? 'Demasiados intentos. Inténtalo nuevamente más tarde'
      : response.status >= 500 ? 'No fue posible conectar con el servidor' : LOGIN_ERROR_MESSAGE);
  }
  return ((await response.json()) as { data: LoginResult }).data;
}

export function getRedirectPath(role: UserRole): string {
  if (role === 'administrador') return '/reports';
  if (role === 'empresa') return '/companies';
  if (role === 'titulado') return '/portal';
  return '/me';
}
