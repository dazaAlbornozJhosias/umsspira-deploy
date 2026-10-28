import { authenticatedFetch } from '@/shared/services/auth-session';
import { readApiError } from '@/shared/services/api-contract';
import { fetchCareers } from '@/modules/registration/frontend/services/registration.service';

export type GraduateCsvStatus = 'TODOS' | 'VERIFICADO' | 'OBSERVADO';

export interface GraduateCsvFilters {
  status?: GraduateCsvStatus;
  career?: string;
  search?: string;
}

export interface GraduateCsvDownload {
  blob: Blob;
  filename: string;
}

export type GraduateCsvProgressHandler = (progress: number) => void;

export const GRADUATE_CSV_ERROR_MESSAGE =
  'No se pudo generar el archivo CSV. Intente nuevamente.';

export function buildGraduateCsvFilename(
  status: GraduateCsvStatus = 'TODOS',
  date: Date = new Date(),
): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const suffix =
    status === 'VERIFICADO'
      ? '-verificados'
      : status === 'OBSERVADO'
        ? '-observados'
        : '';

  return `nomina-egresados${suffix}-${day}${month}${year}.csv`;
}

function getFilename(
  contentDisposition: string | null,
  status: GraduateCsvStatus,
): string {
  if (!contentDisposition) {
    return buildGraduateCsvFilename(status);
  }

  const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1] ?? buildGraduateCsvFilename(status);
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    const message = readApiError(payload, '').message;

    if (message.trim() !== '') {
      return message;
    }
  } catch {
    // La API puede responder sin cuerpo JSON ante ciertos errores de red/proxy.
  }

  return GRADUATE_CSV_ERROR_MESSAGE;
}

async function readResponseBlob(
  response: Response,
  onProgress?: GraduateCsvProgressHandler,
): Promise<Blob> {
  const contentLength = Number(response.headers.get('Content-Length'));

  if (
    !response.body ||
    !Number.isFinite(contentLength) ||
    contentLength <= 0
  ) {
    const blob = await response.blob();
    onProgress?.(100);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let receivedLength = 0;

  onProgress?.(0);

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    const chunkCopy = new Uint8Array(value.byteLength);
    chunkCopy.set(value);
    chunks.push(chunkCopy.buffer);
    receivedLength += value.byteLength;

    onProgress?.(
      Math.min(100, Math.round((receivedLength / contentLength) * 100)),
    );
  }

  onProgress?.(100);

  return new Blob(chunks, {
    type: response.headers.get('Content-Type') ?? 'text/csv',
  });
}

export async function requestGraduateCsv(
  filters: GraduateCsvFilters = {},
  apiBaseUrl: string = '',
  onProgress?: GraduateCsvProgressHandler,
): Promise<GraduateCsvDownload> {
  const params = new URLSearchParams();
  const status = filters.status ?? 'TODOS';

  if (status !== 'TODOS') params.set('status', status === 'VERIFICADO' ? 'APROBADA' : 'OBSERVADA');

  if (filters.career?.trim()) {
    const selected = filters.career.trim();
    const careers = await fetchCareers();
    const career = careers.find((item) => item.id === selected || item.nombre === selected);
    if (!career) throw new Error('No se encontró la carrera seleccionada');
    params.set('careerId', career.id);
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  const query = params.toString();
  const baseUrl = apiBaseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/api/v1/reports/graduates/csv?${query}`;

  let response: Response;

  try {
    response = await authenticatedFetch(url, { method: 'GET' });
  } catch {
    throw new Error(GRADUATE_CSV_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  try {
    return {
      blob: await readResponseBlob(response, onProgress),
      filename: getFilename(
        response.headers.get('Content-Disposition'),
        status,
      ),
    };
  } catch {
    throw new Error(GRADUATE_CSV_ERROR_MESSAGE);
  }
}

export function triggerGraduateCsvDownload({
  blob,
  filename,
}: GraduateCsvDownload): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
