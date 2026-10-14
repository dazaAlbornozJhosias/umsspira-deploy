import { getMentorAreas, MentorAreasError } from './mentor-areas-api';
import { setAccessToken, clearAccessToken } from '@/shared/services/auth-session';
const originalFetch = global.fetch;
const fetchMock = jest.fn();
beforeEach(() => { fetchMock.mockReset(); global.fetch = fetchMock; setAccessToken('test-token'); });
afterEach(() => clearAccessToken());
afterAll(() => { global.fetch = originalFetch; });
it('expone el estado HTTP para manejar acceso denegado', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 403 });
  await expect(getMentorAreas()).rejects.toMatchObject({ status: 403, message: 'No tienes permisos para acceder a esta sección' });
  try { await getMentorAreas(); } catch (error) { expect(error).toBeInstanceOf(MentorAreasError); }
});
it('conserva los intereses dependientes cuando la API los proporciona', async () => {
  const state = { areas: [{ id: '1', nombre: 'Backend', descripcion: null }], selectedIds: ['1'], intereses: [{ id_area: '1', nombre: 'APIs REST' }] };
  fetchMock.mockResolvedValue({ ok: true, json: async () => state });
  expect(await getMentorAreas()).toEqual(state);
});
it('no inventa intereses si el contrato actual no los devuelve', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ areas: [], selectedIds: [] }) });
  expect((await getMentorAreas()).intereses).toBeUndefined();
});
