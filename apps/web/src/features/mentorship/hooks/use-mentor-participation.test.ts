import { act, renderHook, waitFor } from '@testing-library/react';
import { useMentorParticipation } from './use-mentor-participation';
import { getMentorProfile, updateMentorParticipation } from '../services/mentorship-api';

// Dobles exclusivos de pruebas; el flujo de la aplicación siempre usa fetch.
jest.mock('../services/mentorship-api');
const getProfile = jest.mocked(getMentorProfile);
const updateParticipation = jest.mocked(updateMentorParticipation);
const inactive = { isActive: false, requirements: { egresado: true } };

beforeEach(() => {
  jest.resetAllMocks();
  getProfile.mockResolvedValue(inactive);
});

it('consulta el perfil y solo cambia el estado con la respuesta del backend', async () => {
  updateParticipation.mockResolvedValue({ ...inactive, isActive: true });
  const { result } = renderHook(() => useMentorParticipation());
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.profile).toEqual(inactive);
  await act(async () => { await result.current.changeParticipation(true); });
  expect(updateParticipation).toHaveBeenCalledWith(true, expect.any(AbortSignal));
  expect(result.current.profile?.isActive).toBe(true);
});

it('mantiene el estado confirmado si el backend rechaza el cambio', async () => {
  updateParticipation.mockRejectedValue(new Error('Sin permiso'));
  const { result } = renderHook(() => useMentorParticipation());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => { expect(await result.current.changeParticipation(true)).toBe(false); });
  expect(result.current.profile).toEqual(inactive);
  expect(result.current.error).toBe('Sin permiso');
});

it('no fabrica datos si la carga falla y permite reintentar', async () => {
  getProfile.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  const { result } = renderHook(() => useMentorParticipation());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.profile).toBeNull();
  expect(result.current.error).toContain('No se pudo conectar');
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.profile).toEqual(inactive));
  expect(result.current.error).toBe('');
});

it('no envía una activación con requisitos incompletos', async () => {
  getProfile.mockResolvedValue({ ...inactive, requirements: { egresado: false } });
  const { result } = renderHook(() => useMentorParticipation());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => { await result.current.changeParticipation(true); });
  expect(updateParticipation).not.toHaveBeenCalled();
});

it('evita dos cambios simultáneos y espera confirmación del servidor', async () => {
  let resolve!: (value: typeof inactive) => void;
  updateParticipation.mockReturnValue(new Promise(done => { resolve = done; }));
  const { result } = renderHook(() => useMentorParticipation());
  await waitFor(() => expect(result.current.loading).toBe(false));
  let pending!: Promise<boolean>;
  act(() => {
    pending = result.current.changeParticipation(true);
    void result.current.changeParticipation(true);
  });
  expect(updateParticipation).toHaveBeenCalledTimes(1);
  expect(result.current.saving).toBe(true);
  expect(result.current.profile?.isActive).toBe(false);
  await act(async () => { resolve({ ...inactive, isActive: true }); await pending; });
  expect(result.current.saving).toBe(false);
  expect(result.current.profile?.isActive).toBe(true);
});

it('cancela la carga al desmontarse', () => {
  getProfile.mockReturnValue(new Promise(() => {}));
  const { unmount } = renderHook(() => useMentorParticipation());
  const signal = getProfile.mock.calls[0][0];
  unmount();
  expect(signal?.aborted).toBe(true);
});
