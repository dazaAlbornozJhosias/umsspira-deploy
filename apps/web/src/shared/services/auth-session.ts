let accessToken: string | null = null;
const ACCESS_TOKEN_KEY = 'umsspira.access-token';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (!isBrowser()) return null;
  accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
  if (isBrowser()) window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  accessToken = null;
  if (isBrowser()) window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
