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
    const payload = (await response.json()) as { message?: unknown };

    if (typeof payload.message === 'string' && payload.message.trim() !== '') {
      return payload.message;
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
  apiBaseUrl: string = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  onProgress?: GraduateCsvProgressHandler,
): Promise<GraduateCsvDownload> {
  const params = new URLSearchParams();
  const status = filters.status ?? 'TODOS';

  params.set('status', status);

  if (filters.career?.trim()) {
    params.set('career', filters.career.trim());
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  const query = params.toString();
  const baseUrl = apiBaseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/graduates-report/csv?${query}`;

  let response: Response;

  try {
    response = await fetch(url, { method: 'GET' });
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
