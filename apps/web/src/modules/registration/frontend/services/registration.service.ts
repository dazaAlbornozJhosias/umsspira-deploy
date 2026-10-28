import { readApiError } from '@/shared/services/api-contract';

const API_BASE_URL = '/api/v1';

const CONNECTION_ERROR_MESSAGE = 'No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.';

export interface Career {
  id: string;
  nombre: string;
}

export interface FieldErrorDetail {
  field: string;
  message: string;
}

export type CreateSessionResult =
  | { ok: true; sessionToken: string; expiresInSeconds: number }
  | { ok: false; message: string; errors: FieldErrorDetail[] };

export type SessionCheckResult =
  | { status: 'active'; expiresInSeconds: number }
  | { status: 'expired'; message: string }
  | { status: 'unknown' };

type ApiErrorBody = {
  message?: string | string[];
  errors?: FieldErrorDetail[];
};

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function getErrorMessage(body: ApiErrorBody | null, fallback: string): string {
  return readApiError(body, fallback).message;
}

// Catalogo de carreras registradas en la base de datos (no se usan valores inventados).
// cache: 'no-store' evita que el navegador reutilice una copia vieja (304) y la
// lista aparezca vacía aunque la API ya tenga datos.
export async function fetchCareers(): Promise<Career[]> {
  const response = await fetch(`${API_BASE_URL}/registrations/careers`, { cache: 'no-store' });
  const body = await readJson<{ data?: Career[] } & ApiErrorBody>(response);
  if (!response.ok || !Array.isArray(body?.data)) {
    throw new Error(getErrorMessage(body, 'No se pudieron cargar las carreras.'));
  }
  return body.data;
}

export async function createRegistrationSession(data: Record<string, unknown>): Promise<CreateSessionResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/registrations/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    return { ok: false, message: CONNECTION_ERROR_MESSAGE, errors: [] };
  }

  const body = await readJson<{ data?: { sessionToken: string; expiresInSeconds: number } } & ApiErrorBody>(
    response,
  );

  if (!response.ok || !body?.data) {
    return {
      ok: false,
      message: getErrorMessage(body, 'No se pudo procesar el registro. Intenta nuevamente.'),
      errors: readApiError(body, '').errors,
    };
  }

  return { ok: true, sessionToken: body.data.sessionToken, expiresInSeconds: body.data.expiresInSeconds };
}

// CA-01.6: consulta si la sesion temporal (2 horas) sigue vigente en el servidor.
export async function checkRegistrationSession(sessionToken: string): Promise<SessionCheckResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/registrations/sessions/${encodeURIComponent(sessionToken)}`,
      { cache: 'no-store' },
    );
    const body = await readJson<{ data?: { expiresInSeconds: number } } & ApiErrorBody>(response);

    if (response.ok && body?.data) {
      return { status: 'active', expiresInSeconds: body.data.expiresInSeconds };
    }
    if (response.status === 410) {
      return {
        status: 'expired',
        message: getErrorMessage(
          body,
          'El tiempo para completar tu registro venció. Debes llenar el formulario desde el inicio.',
        ),
      };
    }
    return { status: 'unknown' };
  } catch {
    return { status: 'unknown' };
  }
}


export async function updateRegistrationSession(sessionToken: string, data: Record<string, unknown>): Promise<
  { ok: true; verifiedEmail: string | null } | { ok: false; message: string }
> {
  try {
    const response = await fetch(`${API_BASE_URL}/registrations/sessions/${encodeURIComponent(sessionToken)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await readJson<{ data?: { verifiedEmail: string | null } } & ApiErrorBody>(response);
    if (!response.ok || !body?.data) return { ok: false, message: getErrorMessage(body, 'No se pudieron guardar los cambios.') };
    return { ok: true, verifiedEmail: body.data.verifiedEmail };
  } catch {
    return { ok: false, message: CONNECTION_ERROR_MESSAGE };
  }
}
