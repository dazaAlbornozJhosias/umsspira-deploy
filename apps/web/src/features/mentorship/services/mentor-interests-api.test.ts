import { clearAccessToken, getAccessToken, setAccessToken } from '@/shared/services/auth-session';
import { getMentorInterests, saveMentorInterests } from './mentor-interests-api';

const originalFetch = global.fetch;
const fetchMock = jest.fn();
const area = { id: 'area-1', nombre: 'Backend' };
const topics = [{ id: 'rest', nombre: 'REST', area }, { id: 'node', nombre: 'Node.js', area }];
let saved: string[];
let failDelete: boolean;

beforeEach(() => {
  setAccessToken('access-token');
  saved = ['rest'];
  failDelete = false;
  fetchMock.mockReset();
  global.fetch = fetchMock;
  fetchMock.mockImplementation(async (url: string, options: RequestInit) => {
    if (url.endsWith('/catalog')) return response([{ area, intereses: topics.map(t => ({ ...t, seleccionado: saved.includes(t.id) })) }]);
    if (url.endsWith('/mine')) return response(topics.filter(t => saved.includes(t.id)));
    if (options.method === 'POST') {
      const { ids } = JSON.parse(String(options.body));
      if (ids.some((id: string) => saved.includes(id))) return response({ message: 'Duplicado' }, 409);
      saved.push(...ids);
      return response(topics.filter(t => ids.includes(t.id)), 201);
    }
    if (options.method === 'DELETE') {
      if (failDelete) { failDelete = false; return response({ message: 'No se pudo eliminar' }, 500); }
      const id = url.split('/').pop();
      saved = saved.filter(value => value !== id);
      return response({ id, eliminado: true });
    }
    throw new Error(`Solicitud inesperada: ${options.method} ${url}`);
  });
});
afterEach(clearAccessToken);
afterAll(() => { global.fetch = originalFetch; });

function response(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

it('mapea el catálogo y la selección real y envía el Bearer token', async () => {
  const state = await getMentorInterests();
  expect(state.catalog[0]).toEqual({ id: area.id, name: 'Backend', description: '', topics: [{ id: 'rest', name: 'REST' }, { id: 'node', name: 'Node.js' }] });
  expect(state.configuration).toEqual({ areaIds: [area.id], topicIds: ['rest'] });
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/interests/mine'), expect.objectContaining({ cache: 'no-store', credentials: 'omit', headers: { Accept: 'application/json', Authorization: 'Bearer access-token' } }));
});

it('no hace solicitudes sin sesión y limpia el token si recibe 401', async () => {
  clearAccessToken();
  await expect(getMentorInterests()).rejects.toThrow('Inicia sesión');
  expect(fetchMock).not.toHaveBeenCalled();
  setAccessToken('expired');
  fetchMock.mockImplementation(async () => response({}, 401));
  await expect(getMentorInterests()).rejects.toThrow('Inicia sesión');
  expect(getAccessToken()).toBeNull();
});

it('rechaza respuestas de catálogo inválidas', async () => {
  fetchMock.mockImplementation(async (url: string) => response(url.endsWith('/mine') ? [] : [{ area, intereses: [{ id: 'bad', nombre: 'Incorrecto', area: { id: 'other', nombre: 'Otra' } }] }]));
  await expect(getMentorInterests()).rejects.toThrow('no corresponden');
});

it('envía altas y bajas reales y devuelve la configuración confirmada', async () => {
  const result = await saveMentorInterests({ areaIds: [area.id], topicIds: ['node'] });
  expect(result).toEqual({ areaIds: [area.id], topicIds: ['node'] });
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/interests$/), expect.objectContaining({ method: 'POST', body: '{"ids":["node"]}' }));
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/interests\/rest$/), expect.objectContaining({ method: 'DELETE' }));
});

it('permite dejar intereses vacíos sin enviar POST con ids vacíos', async () => {
  expect(await saveMentorInterests({ areaIds: [area.id], topicIds: [] })).toEqual({ areaIds: [area.id], topicIds: [] });
  expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(0);
});

it('rechaza quitar la última área antes de modificar el backend', async () => {
  await expect(saveMentorInterests({ areaIds: [], topicIds: [] })).rejects.toThrow('al menos un área');
  expect(fetchMock.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
});

it('reintenta tras un fallo parcial sin volver a agregar intereses ya guardados', async () => {
  failDelete = true;
  const desired = { areaIds: [area.id], topicIds: ['node'] };
  await expect(saveMentorInterests(desired)).rejects.toThrow('No se pudo eliminar');
  expect(saved).toEqual(['rest', 'node']);
  expect(await saveMentorInterests(desired)).toEqual(desired);
  expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(1);
});

it('guarda las áreas retiradas en HU 6.2 y confirma la limpieza de intereses hijos', async () => {
  const otherArea = { id: 'area-2', nombre: 'Frontend' };
  const otherTopic = { id: 'react', nombre: 'React', area: otherArea };
  let hasOtherArea = true;
  saved = ['rest', 'react'];
  fetchMock.mockImplementation(async (url: string, options: RequestInit) => {
    if (url.endsWith('/catalog')) return response([
      { area, intereses: [{ ...topics[0], seleccionado: saved.includes('rest') }] },
      ...(hasOtherArea ? [{ area: otherArea, intereses: [{ ...otherTopic, seleccionado: true }] }] : []),
    ]);
    if (url.endsWith('/mine')) return response([...topics, otherTopic].filter(t => saved.includes(t.id)));
    if (options.method === 'PATCH') {
      expect(JSON.parse(String(options.body))).toEqual({ areaIds: [area.id] });
      hasOtherArea = false;
      saved = ['rest'];
      return response({ areas: [area, otherArea].map(a => ({ ...a, descripcion: null })), selectedIds: [area.id], intereses: [] });
    }
    throw new Error(`Solicitud inesperada: ${options.method}`);
  });
  expect(await saveMentorInterests({ areaIds: [area.id], topicIds: ['rest'] })).toEqual({ areaIds: [area.id], topicIds: ['rest'] });
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/my-profile/areas'), expect.objectContaining({ method: 'PATCH' }));
});
