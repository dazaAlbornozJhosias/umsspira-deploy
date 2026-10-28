let accessToken: string | null = null;
let refreshInFlight: Promise<string> | null = null;
let generation = 0;

export class SessionError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export function getAccessToken(): string | null { return accessToken; }
export function setAccessToken(token: string): void { accessToken = token; }
export function clearAccessToken(): void {
  accessToken = null;
  generation++;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('token');
      window.sessionStorage.removeItem('umsspira.access-token');
    } catch { /* El almacenamiento del navegador puede estar deshabilitado. */ }
  }
}

export function csrfToken(): string {
  if (typeof document === 'undefined') return '';
  const cookie = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('umsspira_csrf='));
  if (!cookie) return '';
  try { return decodeURIComponent(cookie.slice('umsspira_csrf='.length)); } catch { return ''; }
}

function tokenIsFresh(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() + 30_000;
  } catch { return false; }
}

export async function refreshSession(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;
  const started = generation;
  const renew = async () => {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'X-CSRF-Token': csrfToken() },
    });
    if (!response.ok) {
      if (response.status === 401) clearAccessToken();
      throw new SessionError(response.status, response.status === 401
        ? 'Tu sesión expiró. Inicia sesión nuevamente' : 'No fue posible renovar la sesión');
    }
    const result = await response.json() as { data?: { accessToken?: unknown } };
    const token = result.data?.accessToken;
    if (typeof token !== 'string' || generation !== started) throw new SessionError(401, 'La sesión cambió');
    setAccessToken(token);
    return token;
  };
  // Serializar entre pestañas evita consumir simultáneamente el mismo refresh token.
  const run = async (): Promise<string> => typeof navigator !== 'undefined' && navigator.locks
    ? await navigator.locks.request('umsspira:refresh', async () => await renew()) : await renew();
  refreshInFlight = run().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export async function ensureAccessToken(): Promise<string> {
  if (!accessToken && !csrfToken()) throw new SessionError(401, 'Inicia sesión para continuar');
  return accessToken && tokenIsFresh(accessToken) ? accessToken : refreshSession();
}

export async function authenticatedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const isReadOnly = ['GET', 'HEAD', 'OPTIONS'].includes(method);
  const send = (value?: string) => {
    const headers = Object.fromEntries(new Headers(init.headers).entries());
    delete headers.authorization;
    return fetch(url, {
      ...init,
      ...(!value ? { credentials: init.credentials ?? 'same-origin' } : {}),
      headers: {
        ...headers,
        ...(value ? { Authorization: `Bearer ${value}` } : {}),
      },
    });
  };

  let token = getAccessToken();
  if (!token && !csrfToken()) {
    if (!isReadOnly) throw new SessionError(401, 'Inicia sesión para continuar');
    const cookieResponse = await send();
    if (cookieResponse.status !== 401) return cookieResponse;
    throw new SessionError(401, 'Inicia sesión para continuar');
  }
  token ??= await ensureAccessToken();
  const response = await send(token);
  if (response.status !== 401) return response;
  const current = getAccessToken();
  if (current && current !== token) return send(current);
  if (!csrfToken()) {
    if (getAccessToken() === token) clearAccessToken();
    throw new SessionError(401, 'Inicia sesión para continuar');
  }
  const renewed = await refreshSession();
  const retry = await send(renewed);
  if (retry.status === 401 && getAccessToken() === renewed) clearAccessToken();
  return retry;
}

export async function revokeCurrentSession(): Promise<void> {
  const response = await authenticatedFetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' });
  if (!response.ok) throw new SessionError(response.status, 'No se pudo cerrar la sesión. Inténtalo nuevamente');
  clearAccessToken();
}
