import { authenticatedFetch } from '@/shared/services/auth-session';
import { listReceivedRequests, respondToReceivedRequest, ReceivedRequestsError } from './received-requests-api';

jest.mock('@/shared/services/auth-session', () => ({
  authenticatedFetch: jest.fn(),
  ensureAccessToken: jest.fn(async () => 'test-token'),
  getAccessToken: jest.fn(() => 'test-token'),
  clearAccessToken: jest.fn(),
  SessionError: class SessionError extends Error { constructor(public readonly status: number, message: string) { super(message); } },
}));

const apiRequest = {
  id: 'request-1', id_mentor: 'mentor-1', solicitante: { id: 'user-1', nombre: 'Juan Pérez' },
  fecha: '2026-10-27', hora_inicio: '15:00', hora_fin: '16:00', mensaje: 'Motivo',
  estado: 'PENDIENTE' as const, fecha_creacion: '2026-10-20', fecha_respuesta: null,
};

beforeEach(() => jest.clearAllMocks());

it('lee el listado del mentor autenticado con estado y límite de 20', async () => {
  (authenticatedFetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ data: [apiRequest], pagination: { page: 2, pageSize: 20, total: 21, totalPages: 2 } }),
  });
  const result = await listReceivedRequests('PENDIENTE', 2);
  expect(authenticatedFetch).toHaveBeenCalledWith('/api/v1/mentorship/requests?estado=PENDIENTE&page=2&pageSize=20', expect.objectContaining({ method: 'GET' }));
  expect(result).toEqual({ items: [apiRequest], page: 2, pageSize: 20, total: 21, totalPages: 2 });
});

it('envía PATCH de aceptación y devuelve el estado actualizado', async () => {
  (authenticatedFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ data: { ...apiRequest, estado: 'ACEPTADO', fecha_respuesta: '2026-10-21' } }) });
  const result = await respondToReceivedRequest('request-1', 'accept');
  expect(authenticatedFetch).toHaveBeenCalledWith('/api/v1/mentorship/requests/request-1/accept', expect.objectContaining({ method: 'PATCH' }));
  expect(result.estado).toBe('ACEPTADO');
  expect(result.fecha_respuesta).toBe('2026-10-21');
});

it('preserva el conflicto SOLICITUD_NO_PENDIENTE para refrescar el estado en pantalla', async () => {
  (authenticatedFetch as jest.Mock).mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: { code: 'SOLICITUD_NO_PENDIENTE', message: 'Esta solicitud ya no está pendiente' } }) });
  await expect(respondToReceivedRequest('request-1', 'reject')).rejects.toMatchObject({
    status: 409, code: 'SOLICITUD_NO_PENDIENTE',
  } satisfies Partial<ReceivedRequestsError>);
});
