import {
  getMentorProfileInformation,
  updateMentorProfileInformation,
  deleteMentorProfileInformation,
  MentorProfileInfoError,
} from './mentor-profile-info-api';
import { setAccessToken, clearAccessToken } from '@/shared/services/auth-session';

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  setAccessToken('test-token');
});

afterEach(() => {
  clearAccessToken();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('mentor-profile-info-api', () => {
  it('obtiene la información del perfil del mentor', async () => {
    const mockState = {
      exists: true,
      profile: {
        descripcion: 'Desarrollador fullstack',
        experiencia: '10 años en React y Node',
        informacion_relevante: 'Mentorías los fines de semana',
        foto_perfil: null,
        anios_exp: 10,
        fecha_actualizacion: '2026-10-07',
      },
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockState,
    });

    const result = await getMentorProfileInformation();
    expect(result).toEqual(mockState);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/mentorship/my-profile/information'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('actualiza la información del perfil del mentor', async () => {
    const payload = {
      descripcion: 'Nueva descripción',
      experiencia: 'Nueva experiencia',
      informacion_relevante: 'Nuevo enfoque',
    };
    const mockState = {
      exists: true,
      profile: {
        ...payload,
        foto_perfil: null,
        anios_exp: null,
        fecha_actualizacion: '2026-10-07',
      },
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockState,
    });

    const result = await updateMentorProfileInformation(payload);
    expect(result).toEqual(mockState);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/mentorship/my-profile/information'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    );
  });

  it('elimina la información del perfil del mentor', async () => {
    const mockState = {
      exists: false,
      profile: null,
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockState,
    });

    const result = await deleteMentorProfileInformation();
    expect(result).toEqual(mockState);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/mentorship/my-profile/information'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('maneja errores con MentorProfileInfoError', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Prohibido',
    });

    await expect(getMentorProfileInformation()).rejects.toThrow(MentorProfileInfoError);
  });
});
