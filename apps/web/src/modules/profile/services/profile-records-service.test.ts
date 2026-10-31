import { deleteProfileRecord, DeleteRecordException } from '@/modules/profile/services/profile-records-service';
import type { ProfileRecord } from '@/modules/profile/types/profile-record';
import { ApiError, apiFetch } from '@/shared/services/api-client';

jest.mock('@/shared/services/api-client', () => ({
  ...jest.requireActual('@/shared/services/api-client'),
  apiFetch: jest.fn(),
}));

const apiFetchMock = jest.mocked(apiFetch);
const registro = { id: 'cert-1' } as ProfileRecord;

describe('deleteProfileRecord', () => {
  beforeEach(() => apiFetchMock.mockReset());

  it('llama al DELETE de la sección', async () => {
    apiFetchMock.mockResolvedValue(undefined);
    await deleteProfileRecord('certification', registro);

    expect(apiFetchMock).toHaveBeenCalledWith('/api/v1/perfil/certificaciones/cert-1', { method: 'DELETE' });
  });

  // Deploy personal: sin backend el registro se quita solo de la lista guardada en el navegador
  it.each([0, 401, 503])('sin backend (status %i) termina sin error', async (status) => {
    apiFetchMock.mockRejectedValue(new ApiError(status, 'Sin backend'));

    await expect(deleteProfileRecord('certification', registro)).resolves.toBeUndefined();
  });

  it('informa 403 como registro ajeno', async () => {
    apiFetchMock.mockRejectedValue(new ApiError(403, 'Prohibido'));

    await expect(deleteProfileRecord('certification', registro)).rejects.toEqual(new DeleteRecordException('forbidden'));
  });

  it('informa cualquier otro fallo como error de conexión', async () => {
    apiFetchMock.mockRejectedValue(new ApiError(500, 'Error'));

    await expect(deleteProfileRecord('certification', registro)).rejects.toEqual(new DeleteRecordException('network'));
  });
});
