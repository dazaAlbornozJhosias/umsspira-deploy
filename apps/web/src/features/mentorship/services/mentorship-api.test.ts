import { getMentorProfile, updateMentorParticipation } from './mentorship-api';
import { setAccessToken, clearAccessToken, getAccessToken } from '@/shared/services/auth-session';

const profile = { isActive: false, requirements: { egresado: true } };
const fetchMock = jest.fn();
const originalFetch = global.fetch;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  setAccessToken('test-access-token');
});
afterEach(() => clearAccessToken());
afterAll(() => { global.fetch = originalFetch; });

it('consulta el perfil con credenciales y sin caché', async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ eligible: true }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ esta_activo: false }) });
  expect(await getMentorProfile()).toEqual(profile);
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/mentorship/eligibility'), expect.objectContaining({ method: 'POST', credentials: 'omit', headers: { Accept: 'application/json', Authorization: 'Bearer test-access-token' } }));
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/mentorship/my-profile'), expect.objectContaining({ method: 'GET', credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json', Authorization: 'Bearer test-access-token' } }));
});

it('permite la primera activación cuando el usuario aún no tiene registro de mentor', async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ eligible: true }) })
    .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ message: 'El usuario no tiene perfil de mentor' }) });
  expect(await getMentorProfile()).toEqual(profile);
});

it('usa la elegibilidad real y trata esta_activo null como inactivo', async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ eligible: false }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ esta_activo: null }) });
  expect(await getMentorProfile()).toEqual({ isActive: false, requirements: { egresado: false } });
});

it('envía PATCH JSON y devuelve el estado confirmado', async () => {
  const active = { ...profile, isActive: true };
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ eligible: true }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ esta_activo: true }) });
  expect(await updateMentorParticipation(true)).toEqual(active);
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/mentorship/my-profile/participation'), expect.objectContaining({ method: 'PATCH', body: '{"esta_activo":true}', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer test-access-token' } }));
});

it('no envía solicitudes protegidas sin token', async () => {
  clearAccessToken();
  await expect(getMentorProfile()).rejects.toThrow('Inicia sesión');
  expect(fetchMock).not.toHaveBeenCalled();
});

it('descarta el token rechazado con 401', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 401 });
  await expect(getMentorProfile()).rejects.toThrow('Inicia sesión');
  expect(getAccessToken()).toBeNull();
});

it('usa el token actualizado en las solicitudes siguientes', async () => {
  setAccessToken('renewed-token');
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ eligible: true }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ esta_activo: false }) });
  await getMentorProfile();
  expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    headers: expect.objectContaining({ Authorization: 'Bearer renewed-token' }),
  }));
});

it.each([401, 403, 404, 500])('rechaza HTTP %s', async status => {
  fetchMock.mockResolvedValue({ ok: false, status });
  await expect(getMentorProfile()).rejects.toThrow();
});

it.each([null, {}, { isActive: 'true', requirements: profile.requirements }, { isActive: false, requirements: { egresado: true } }])('rechaza respuestas incompletas: %j', async data => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ eligible: true }) }).mockResolvedValueOnce({ ok: true, json: async () => data });
  await expect(getMentorProfile()).rejects.toThrow('formato inválido');
});
