import { clearAccessToken, getAccessToken, setAccessToken } from '@/shared/services/auth-session';

export const LEGACY_TOKEN_KEY = 'token';

export function saveSession(token: string, _role: string, _remember: boolean): void {
  clearAccessToken();
  setAccessToken(token);
}

export function clearSession(): void { clearAccessToken(); }
export function getSessionToken(): string | null { return getAccessToken(); }
