import { setAccessToken, clearAccessToken } from './auth-session';
import { markPendingProfileChanges, hasPendingProfileChanges, clearPendingProfileChanges } from './pending-profile-changes';
import { deleteProfileRecord } from '@/modules/profile/services/profile-records-service';
import { apiFetch, ApiError } from './api-client';

jest.mock('./api-client', () => ({
  apiFetch: jest.fn(),
  ApiError: jest.requireActual('./api-client').ApiError,
}));

beforeEach(() => { sessionStorage.clear(); jest.clearAllMocks(); clearAccessToken(); });
afterEach(() => { clearAccessToken(); sessionStorage.clear(); });

it('aisla el aviso entre usuarios y lo conserva al renovar el token del mismo usuario', () => {
  const token = (sub: string, exp: number) => `header.${btoa(JSON.stringify({ sub, exp }))}.sig`;
  setAccessToken(token('alice', 1));
  markPendingProfileChanges();
  setAccessToken(token('bob', 1));
  expect(hasPendingProfileChanges()).toBe(false);
  setAccessToken(token('alice', 2));
  expect(hasPendingProfileChanges()).toBe(true);
  clearPendingProfileChanges();
  expect(hasPendingProfileChanges()).toBe(false);
});

it.each(['education', 'experience', 'certification'] as const)('marca pendiente solo tras DELETE exitoso de %s', async (section) => {
  (apiFetch as jest.Mock).mockResolvedValueOnce(undefined);
  await deleteProfileRecord(section, { id: 'qa-record' } as Parameters<typeof deleteProfileRecord>[1]);
  expect(hasPendingProfileChanges()).toBe(true);
});

it.each([403, 500, 0])('DELETE fallido %s no marca cambios ni borra la confirmacion de otra eliminacion', async (status) => {
  (apiFetch as jest.Mock).mockRejectedValue(new ApiError(status, 'Error'));
  await expect(deleteProfileRecord('education', { id: 'qa-record' } as Parameters<typeof deleteProfileRecord>[1])).rejects.toThrow();
  expect(hasPendingProfileChanges()).toBe(false);
  markPendingProfileChanges();
  await expect(deleteProfileRecord('education', { id: 'qa-record' } as Parameters<typeof deleteProfileRecord>[1])).rejects.toThrow();
  expect(hasPendingProfileChanges()).toBe(true);
});

it('un DELETE 404 idempotente tambien deja pendiente el radar', async () => {
  (apiFetch as jest.Mock).mockRejectedValueOnce(new ApiError(404, 'Not found'));
  await deleteProfileRecord('experience', { id: 'qa-record' } as Parameters<typeof deleteProfileRecord>[1]);
  expect(hasPendingProfileChanges()).toBe(true);
});
