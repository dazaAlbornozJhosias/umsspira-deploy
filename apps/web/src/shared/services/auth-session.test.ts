import { authenticatedFetch, clearAccessToken, getAccessToken, setAccessToken } from './auth-session';

beforeEach(() => {
  clearAccessToken();
});

it('mantiene el access token en memoria sin persistirlo en el navegador', () => {
  setAccessToken('temporary-test-token');

  expect(getAccessToken()).toBe('temporary-test-token');
  expect(window.sessionStorage.getItem('umsspira.access-token')).toBeNull();
  expect(window.localStorage.getItem('token')).toBeNull();
});

it('no restaura tokens de un almacenamiento anterior al reiniciar el módulo', () => {
  window.sessionStorage.setItem('umsspira.access-token', 'temporary-test-token');
  jest.resetModules();
  const session = require('./auth-session') as typeof import('./auth-session');

  expect(session.getAccessToken()).toBeNull();
});

it('elimina el token también del almacenamiento de sesión', () => {
  setAccessToken('temporary-test-token');
  clearAccessToken();

  expect(getAccessToken()).toBeNull();
  expect(window.sessionStorage.getItem('umsspira.access-token')).toBeNull();
});

it('comparte una sola renovación entre peticiones paralelas después de recargar', async () => {
  const originalFetch = global.fetch;
  document.cookie = 'umsspira_csrf=csrf-de-prueba; path=/';
  const fetchMock = jest.fn(async (url: string) => url.endsWith('/auth/refresh')
    ? { ok: true, json: async () => ({ data: { accessToken: 'renovado' } }) }
    : { ok: true });
  global.fetch = fetchMock as jest.Mock;
  try {
    await Promise.all([
      authenticatedFetch('/api/v1/reports/metrics'),
      authenticatedFetch('/api/v1/mentorship/my-profile'),
    ]);
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
    expect(getAccessToken()).toBe('renovado');
  } finally {
    document.cookie = 'umsspira_csrf=; path=/; max-age=0';
    global.fetch = originalFetch;
    clearAccessToken();
  }
});

it('sustituye el Authorization anterior sin duplicar encabezados al enviar el token vigente', async () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue({ ok: true });
  global.fetch = fetchMock;
  setAccessToken('vigente');
  try {
    await authenticatedFetch('/api/v1/user/me', { headers: { Authorization: 'Bearer anterior' } });
    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get('Authorization')).toBe('Bearer vigente');
  } finally {
    global.fetch = originalFetch;
  }
});

it('recupera una sesión de lectura desde la cookie HttpOnly aunque no exista token en memoria ni CSRF', async () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  global.fetch = fetchMock;
  try {
    await authenticatedFetch('/api/v1/auth/me');

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(request.headers);
    expect(headers.has('Authorization')).toBe(false);
    expect(request.credentials).toBe('same-origin');
  } finally {
    global.fetch = originalFetch;
  }
});

it('no intenta una mutación con cookies cuando falta la protección CSRF', async () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  global.fetch = fetchMock;
  try {
    await expect(authenticatedFetch('/api/v1/events/event-id/registrations', {
      method: 'POST',
    })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    global.fetch = originalFetch;
  }
});
