import { readApiError } from '@/shared/services/api-contract';
import type { ObservedApplicationDetail } from '@umsspira/shared-types';
import type { CorrectionResult } from '../hooks/use-observed-correction';

const OBSERVED_URL = '/api/v1/registrations/observed';

export type FetchObservedApplicationResult =
  | { status: 'success'; data: ObservedApplicationDetail }
  | { status: 'invalid-link' }
  | { status: 'error'; message: string };

export type RequestLinkResult =
  | { status: 'success'; message: string }
  | { status: 'rate-limited'; message: string }
  | { status: 'error'; message: string };

export type ResubmitOutcome =
  | { status: 'success' }
  | { status: 'conflict' } // CA-10.5: la solicitud cambió
  | { status: 'email-verification' } // el backend exige verificar el nuevo correo
  | { status: 'invalid-link' }
  | { status: 'expired' }
  | { status: 'error'; message: string };

// Avance del reenvío: permite reintentar sin repetir pasos ya guardados.
export type ResubmitProgress = {
  version: number;
  dataSaved: boolean;
  documentSaved: boolean;
};

const CONNECTION_ERROR =
  'No se pudo conectar con el servidor. Tus cambios siguen aquí, intenta nuevamente.';

// Campos que acepta PATCH /registrations/observed (updateObservedDataSchema).
// El schema es estricto y exige todos a la vez, aunque solo cambie uno.
const PATCHABLE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'career',
  'graduationYear',
] as const;

function authHeaders(token: string): Record<string, string> {
  return { 'X-Correction-Token': token };
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type Envelope = { data?: { version?: unknown; requiresEmailVerification?: unknown } } | null;

function readVersion(body: unknown, fallback: number): number {
  const version = (body as Envelope)?.data?.version;
  return typeof version === 'number' ? version : fallback;
}

async function failure(response: Response): Promise<ResubmitOutcome> {
  if (response.status === 409) return { status: 'conflict' };
  if (response.status === 404) return { status: 'invalid-link' };
  if (response.status === 410) return { status: 'expired' };
  const body = await readBody(response);
  return {
    status: 'error',
    message: readApiError(body as never, 'No pudimos entregar tu solicitud. Intenta nuevamente.')
      .message,
  };
}

export async function getObservedApplication(token: string): Promise<FetchObservedApplicationResult> {
  try {
    const res = await fetch(OBSERVED_URL, {
      method: 'GET',
      headers: authHeaders(token),
      cache: 'no-store',
    });
    if (res.status === 404 || res.status === 410) {
      return { status: 'invalid-link' };
    }
    const body = (await readBody(res)) as { data?: ObservedApplicationDetail; error?: { message?: string } } | null;
    if (!res.ok || !body?.data) {
      const msg = readApiError(body as never, 'No fue posible obtener los datos de la solicitud.').message;
      return { status: 'error', message: msg };
    }
    return { status: 'success', data: body.data };
  } catch {
    return { status: 'error', message: CONNECTION_ERROR };
  }
}

export async function requestCorrectionLink(payload: {
  ci: string;
  complemento?: string;
  expedidoEn: string;
}): Promise<RequestLinkResult> {
  try {
    const res = await fetch(`${OBSERVED_URL}/request-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ci: payload.ci,
        complemento: payload.complemento || undefined,
        expedidoEn: payload.expedidoEn,
      }),
    });
    if (res.status === 429) {
      return {
        status: 'rate-limited',
        message: 'Demasiadas solicitudes; intenta más tarde',
      };
    }
    const body = (await readBody(res)) as { data?: { message?: string }; error?: { message?: string } } | null;
    if (!res.ok) {
      const msg = readApiError(body as never, 'No se pudo procesar la solicitud.').message;
      return { status: 'error', message: msg };
    }
    return {
      status: 'success',
      message:
        body?.data?.message ??
        'Si los datos corresponden a una solicitud observada, se enviará un enlace de corrección al correo registrado',
    };
  } catch {
    return { status: 'error', message: CONNECTION_ERROR };
  }
}

// CA-10.4: se trabaja siempre sobre el expediente del enlace; nunca se crea uno nuevo.
// CA-10.5: PATCH y submit llevan expectedVersion; un 409 significa que otra pestaña guardó antes.
export async function resubmitObservedApplication(
  token: string,
  result: CorrectionResult,
  progress: ResubmitProgress,
): Promise<ResubmitOutcome> {
  const { values, changedFields, file } = result;

  try {
    const dataChanged = PATCHABLE_FIELDS.some((k) => changedFields.includes(k));
    if (dataChanged && !progress.dataSaved) {
      const res = await fetch(OBSERVED_URL, {
        method: 'PATCH',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedVersion: progress.version,
          nombres: values.firstName,
          apellidos: values.lastName,
          correo: values.email,
          telefono: values.phone,
          carreraId: values.career, // UUID de la carrera
          anioEgreso: Number(values.graduationYear),
        }),
      });
      if (!res.ok) return await failure(res);
      const body = await readBody(res);
      progress.version = readVersion(body, progress.version);
      progress.dataSaved = true;
      if ((body as Envelope)?.data?.requiresEmailVerification === true) {
        return { status: 'email-verification' };
      }
    }

    if (file && !progress.documentSaved) {
      const form = new FormData();
      form.append('file', file); // AnyFilesInterceptor acepta cualquier nombre de campo
      form.append('tipoDocumento', values.documentType);
      // Sin Content-Type: el navegador agrega el boundary del multipart.
      const res = await fetch(`${OBSERVED_URL}/document`, {
        method: 'POST',
        headers: authHeaders(token),
        body: form,
      });
      if (!res.ok) return await failure(res);
      progress.documentSaved = true;

      // La respuesta del documento no trae version: se vuelve a leer el detalle
      // para enviar el submit con la versión vigente (sirve se incremente o no).
      const detail = await fetch(OBSERVED_URL, { headers: authHeaders(token) });
      if (!detail.ok) return await failure(detail);
      progress.version = readVersion(await readBody(detail), progress.version);
    }

    const res = await fetch(`${OBSERVED_URL}/submit`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ expectedVersion: progress.version }),
    });
    if (!res.ok) return await failure(res);
    return { status: 'success' };
  } catch {
    return { status: 'error', message: CONNECTION_ERROR };
  }
}
