import { authenticatedFetch, ensureAccessToken, getAccessToken, clearAccessToken, SessionError } from '@/shared/services/auth-session';
import { readApiError } from '@/shared/services/api-contract';

export type ReceivedRequestStatus = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'CANCELADO';
export type ReceivedRequest = {
  id: string;
  id_mentor: string;
  solicitante: { id: string; nombre: string | null };
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  mensaje: string | null;
  estado: ReceivedRequestStatus;
  fecha_creacion: string | null;
  fecha_respuesta: string | null;
};
export type ReceivedRequestPage = { items: ReceivedRequest[]; page: number; pageSize: number; total: number; totalPages: number };

export class ReceivedRequestsError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
    this.name = 'ReceivedRequestsError';
  }
}

function isRequest(value: unknown): value is ReceivedRequest {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ReceivedRequest>;
  return typeof item.id === 'string' && typeof item.id_mentor === 'string'
    && !!item.solicitante && typeof item.solicitante === 'object'
    && typeof item.fecha === 'string' && typeof item.hora_inicio === 'string'
    && typeof item.hora_fin === 'string'
    && ['PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'CANCELADO'].includes(String(item.estado));
}

async function request<T>(path: string, init: RequestInit, parse: (data: unknown) => T): Promise<T> {
  let token: string;
  try {
    token = getAccessToken() ?? await ensureAccessToken();
  } catch (error) {
    if (error instanceof SessionError) throw new ReceivedRequestsError(error.message, error.status);
    throw new ReceivedRequestsError('Inicia sesión para consultar tus solicitudes.', 401);
  }
  let response: Response;
  const controller = new AbortController();
  const relayAbort = () => controller.abort();
  init.signal?.addEventListener('abort', relayAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    response = await authenticatedFetch(path, {
      ...init, credentials: 'omit', cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json', ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ReceivedRequestsError(
      controller.signal.aborted && !init.signal?.aborted ? 'La solicitud tardó demasiado. Intenta nuevamente.' : 'No se pudo conectar con el servidor. Intenta nuevamente.',
      0,
    );
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', relayAbort);
  }
  let body: unknown;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) {
    if (response.status === 401 && getAccessToken() === token) clearAccessToken();
    const apiError = readApiError(body, 'No se pudo cargar la solicitud.');
    throw new ReceivedRequestsError(apiError.message, response.status, apiError.code);
  }
  try {
    return parse(body);
  } catch {
    throw new ReceivedRequestsError('El servidor devolvió una solicitud con formato inválido.', 502);
  }
}

export async function listReceivedRequests(status: ReceivedRequestStatus, page = 1, signal?: AbortSignal): Promise<ReceivedRequestPage> {
  const query = new URLSearchParams({ estado: status, page: String(page), pageSize: '20' });
  return request(`/api/v1/mentorship/requests?${query}`, { method: 'GET', signal }, (data) => {
    if (!data || typeof data !== 'object') throw new Error('invalid response');
    const envelope = data as { data?: unknown; pagination?: Partial<ReceivedRequestPage>; items?: unknown };
    const items = Array.isArray(envelope.data) ? envelope.data : envelope.items;
    const pagination = envelope.pagination ?? envelope as Partial<ReceivedRequestPage>;
    if (!Array.isArray(items)) throw new Error('invalid items');
    const parsedItems = items.filter(isRequest);
    if (parsedItems.length !== items.length) throw new Error('invalid items');
    return { items: parsedItems, page: pagination.page ?? page, pageSize: pagination.pageSize ?? 20, total: pagination.total ?? parsedItems.length, totalPages: pagination.totalPages ?? 1 };
  });
}

export function getReceivedRequest(id: string, signal?: AbortSignal): Promise<ReceivedRequest> {
  return request(`/api/v1/mentorship/requests/${encodeURIComponent(id)}`, { method: 'GET', signal }, (data) => {
    const request = data && typeof data === 'object' && 'data' in data ? (data as { data: unknown }).data : data;
    if (!isRequest(request)) throw new Error('invalid request');
    return request;
  });
}

export function respondToReceivedRequest(id: string, action: 'accept' | 'reject', signal?: AbortSignal): Promise<ReceivedRequest> {
  return request(`/api/v1/mentorship/requests/${encodeURIComponent(id)}/${action}`, { method: 'PATCH', signal }, (data) => {
    const request = data && typeof data === 'object' && 'data' in data ? (data as { data: unknown }).data : data;
    if (!isRequest(request)) throw new Error('invalid request');
    return request;
  });
}
