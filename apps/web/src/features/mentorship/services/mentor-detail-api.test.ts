import {
  getMentorDetail,
  MentorNotFoundError,
} from './mentor-detail-api';
import { setAccessToken, clearAccessToken, SessionError } from '@/shared/services/auth-session';

const fetchMock = jest.fn();
const originalFetch = global.fetch;

beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = fetchMock;
  setAccessToken('test-token');
});

afterEach(() => {
  clearAccessToken();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('getMentorDetail', () => {
  // Respuesta real de GET /api/v1/mentorship/profiles/:id (sección 17 de HUXX.md).
  const backendMentorPayload = {
    id: '66000000-0000-4000-8000-000000000001',
    fullName: 'Carlos Vargas',
    photoUrl: 'https://example.com/carlos.jpg',
    jobTitle: 'Arquitecto de Software',
    company: 'Jalasoft',
    about: 'Ingeniero de Sistemas con 12 años de experiencia.',
    experience: 'Arquitecto de Software en Jalasoft.',
    relevantInfo: 'Disponible para mentorías.',
    technicalAreas: ['Desarrollo de Software'],
    interests: [{ area: 'Desarrollo de Software', items: ['Arquitectura limpia'] }],
    availability: 'AVAILABLE',
    weekLabel: 'Del 23 al 29 oct · sesiones de 1 hora',
    slots: [{ date: '2026-10-27', dayLabel: 'martes 27 oct', times: ['18:00', '19:00'] }],
  };

  it('consulta el endpoint con autorización y retorna los datos públicos', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: backendMentorPayload }),
    });

    const result = await getMentorDetail(backendMentorPayload.id);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/mentorship/profiles/${backendMentorPayload.id}`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(result).toEqual(backendMentorPayload);
  });

  it('acepta un mentor sin disponibilidad configurada', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { ...backendMentorPayload, availability: null, slots: [] } }),
    });

    await expect(getMentorDetail(backendMentorPayload.id)).resolves.toMatchObject({
      availability: null,
      slots: [],
    });
  });

  it('descarta fotos que no son URL http(s) públicas', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { ...backendMentorPayload, photoUrl: 'javascript:alert(1)' } }),
    });

    await expect(getMentorDetail(backendMentorPayload.id)).resolves.toMatchObject({
      photoUrl: null,
    });
  });

  it('NO usa datos falsos si la API falla con 500', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(getMentorDetail('carlos-vargas')).rejects.toThrow(
      'Ocurrió un problema al consultar el perfil del mentor. Revisa tu conexión e inténtalo nuevamente.',
    );
  });

  it.each([400, 404])('lanza MentorNotFoundError cuando la API devuelve %i', async (status) => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status,
    });

    await expect(getMentorDetail('inexistente')).rejects.toBeInstanceOf(MentorNotFoundError);
  });

  it('lanza SessionError cuando la API devuelve 401', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    await expect(getMentorDetail('carlos-vargas')).rejects.toBeInstanceOf(SessionError);
  });

  it('rechaza respuestas con un formato distinto al contrato', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'x', nombre: 'Carlos Vargas' } }),
    });

    await expect(getMentorDetail('x')).rejects.toThrow(
      'No se pudo interpretar la respuesta del perfil del mentor. Inténtalo nuevamente.',
    );
  });
});
