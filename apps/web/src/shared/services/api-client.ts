import { authenticatedFetch, clearAccessToken, getAccessToken, SessionError } from './auth-session';
import { apiUrl, readApiError } from './api-contract';

interface ApiClientOptions
  extends Omit<RequestInit, 'body'> {
  body?: unknown;
  authenticated?: boolean;
}

export class ApiClientError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function apiRequest<TResponse>(
  path: string,
  options: ApiClientOptions = {},
): Promise<TResponse> {
  const { body, headers: providedHeaders, authenticated = false, ...requestOptions } =
    options;
  const headers = new Headers(providedHeaders);

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await (authenticated ? authenticatedFetch : fetch)(apiUrl(path), {
    ...requestOptions,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const responseText = await response.text();
  let responseData: unknown;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
  }

  if (!response.ok) {
    const message = getErrorMessage(responseData);
    const errorCode = readApiError(responseData, '').code;

    throw new ApiClientError(
      message ??
        `La solicitud falló con el estado ${response.status}.`,
      response.status,
      errorCode,
    );
  }

  return responseData as TResponse;
}

function getErrorMessage(responseData: unknown): string | null {
  if (responseData && typeof responseData === 'object' && 'error' in responseData) {
    return readApiError(responseData, 'No se pudo procesar la solicitud').message;
  }
  if (
    typeof responseData !== 'object' ||
    responseData === null ||
    !('message' in responseData)
  ) {
    return null;
  }

  const { message } = responseData;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return typeof message === 'string' ? message : null;
}

export class ApiException extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
  }
}

async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    throw new ApiException(response.status, `Error ${response.status} al consultar ${path}`);
  }

  return (await response.json()) as TResponse;
}

// Conserva las dos formas usadas por eventos y afinidad.
export const apiClient = Object.assign(apiRequest, {
  get: <TResponse>(path: string) => request<TResponse>(path),
  post: <TResponse, TBody = unknown>(path: string, body?: TBody) =>
    request<TResponse>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
});

export const TOKEN_KEY = 'token';

/** Deploy de demo: no exige sesion. Se fija al compilar (NEXT_PUBLIC_*). */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  return getAccessToken();
}

export function clearToken(): void {
  clearAccessToken();
}

/** true si hay token y no expiro (solo UX; la seguridad real la aplica la API con 401). */
export function hasValidSession(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Convierte el cuerpo de error de Nest (string | string[]) en un texto legible. */
function errorMessage(body: unknown, fallback: string): string {
  const payload = body as { message?: string | string[]; error?: { message?: string } } | null;
  const msg = payload?.error?.message ?? payload?.message;
  return Array.isArray(msg) ? msg.join(', ') : msg || fallback;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // En modo demo no se envia un token vencido o invalido: la API lo rechazaria con 401.
  const stored = getToken();
  const token = stored && (!DEMO_MODE || hasValidSession()) ? stored : null;
  let res: Response;
  try {
    res = await authenticatedFetch(apiUrl(path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof SessionError) throw new ApiError(error.status, error.message);
    throw new ApiError(0, 'No fue posible conectar con el servidor');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) throw new ApiError(401, 'Tu sesion expiro. Inicia sesion nuevamente');
    throw new ApiError(res.status, errorMessage(body, 'Error inesperado'));
  }
  return body?.data as T;
}
