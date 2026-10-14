import { apiClient, ApiException, apiFetch, ApiError, TOKEN_KEY, clearToken, hasValidSession } from './api-client';

describe('compatibilidad del cliente HTTP entre eventos y afinidad', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.clear();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it('conserva el token de empresas y su llamada HTTP', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-empresa');
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ nombre: 'Empresa' }) });

    await expect(apiFetch('/api/empresa/perfil/header')).resolves.toEqual({ nombre: 'Empresa' });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer token-empresa');
  });

  it('conserva el error de sesión de empresas con estado 401', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(apiFetch('/api/empresa/perfil/header')).rejects.toMatchObject({
      name: 'ApiError', status: 401,
    });
    expect(new ApiError(401, 'Sesión vencida')).toBeInstanceOf(Error);
  });

  it('conserva la comprobación y eliminación de la sesión de empresas', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 }));
    localStorage.setItem(TOKEN_KEY, `header.${payload}.firma`);
    expect(hasValidSession()).toBe(true);
    clearToken();
    expect(hasValidSession()).toBe(false);
  });

  it('conserva la llamada de eventos, los encabezados y la serialización del cuerpo', async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => '{"id":"evento-1"}' });

    await expect(apiClient('/api/events', {
      method: 'POST', headers: { 'x-user-id': 'usuario-1' }, body: { titulo: 'Encuentro' },
    })).resolves.toEqual({ id: 'evento-1' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toEqual(expect.stringContaining('/api/events'));
    expect(options.body).toBe('{"titulo":"Encuentro"}');
    expect(options.headers.get('x-user-id')).toBe('usuario-1');
    expect(options.headers.get('Content-Type')).toBe('application/json');
  });

  it('conserva get y post usados por afinidad', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ porcentaje: 80 }) });

    await expect(apiClient.get('/api/affinity/vector')).resolves.toEqual({ porcentaje: 80 });
    await expect(apiClient.post('/api/affinity/calculate', {})).resolves.toEqual({ porcentaje: 80 });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', body: '{}' });
  });

  it('conserva el estado HTTP en los errores de los métodos de afinidad', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(apiClient.get('/api/affinity/vector')).rejects.toBeInstanceOf(ApiException);
    await expect(apiClient.get('/api/affinity/vector')).rejects.toMatchObject({ status: 404 });
  });

  it('conserva los mensajes de validación del backend de eventos', async () => {
    fetchMock.mockResolvedValue({
      ok: false, status: 400, text: async () => '{"message":["Falta el título","Falta la fecha"]}',
    });
    await expect(apiClient('/api/events')).rejects.toThrow('Falta el título Falta la fecha');
  });
});
