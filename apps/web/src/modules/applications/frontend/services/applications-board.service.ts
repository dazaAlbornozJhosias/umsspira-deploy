import { authenticatedFetch, SessionError } from '@/shared/services/auth-session';
import { readApiError } from '@/shared/services/api-contract';

const APPLICATIONS_URL = '/api/v1/applications';

export type BoardStatus = 'PENDIENTE' | 'OBSERVADA' | 'APROBADA' | 'RECHAZADA';

export interface BoardItem {
  id: string;
  code: string;
  fullName: string;
  email: string;
  ci: string;
  issuedIn: string;
  sisCode: string;
  career: string;
  careerId: string | null;
  status: BoardStatus;
  submittedAt: string;
}

export interface BoardDetail extends BoardItem {
  firstName: string;
  lastName: string;
  phone: string;
  graduationYear: number | null;
  documentName: string;
  documentPath: string | null;
  documentFormat: string;
}

export interface BoardPage {
  items: BoardItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BoardQuery {
  page: number;
  pageSize: number;
  career?: string;
  status?: '' | BoardStatus;
  search?: string;
  age?: '' | 'within48' | 'over48';
}

export type BoardResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; needsLogin: boolean; message: string };

type ApiErrorBody = { message?: string | string[]; error?: string };

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function toMessage(body: ApiErrorBody | null, fallback: string): string {
  return readApiError(body, fallback).message;
}

async function boardFetch<T>(url: string): Promise<BoardResult<T>> {
  let response: Response;
  try {
    response = await authenticatedFetch(url);
  } catch (error) {
    if (error instanceof SessionError) {
      return { ok: false, status: error.status, needsLogin: error.status === 401, message: error.message };
    }
    return { ok: false, status: 0, needsLogin: false, message: 'No se pudo conectar con el servidor. Intenta nuevamente.' };
  }
  const body = await readJson<{ data?: T } & ApiErrorBody>(response);
  if (response.ok && body?.data) return { ok: true, data: body.data };
  return {
    ok: false,
    status: response.status,
    needsLogin: response.status === 401,
    message: toMessage(body, 'No se pudieron cargar las solicitudes.'),
  };
}

// Bandeja paginada con filtros (CA-04.1 y CA-04.2).
export function fetchApplicationsBoard(query: BoardQuery): Promise<BoardResult<BoardPage>> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.career) params.set('career', query.career);
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  if (query.age) params.set('age', query.age);
  return boardFetch<BoardPage>(`${APPLICATIONS_URL}?${params.toString()}`);
}

// Expediente para el drawer (CA-04.3).
export function fetchApplicationDetail(id: string): Promise<BoardResult<BoardDetail>> {
  return boardFetch<BoardDetail>(`${APPLICATIONS_URL}/${encodeURIComponent(id)}`);
}

// Acceso temporal al adjunto (URL firmada de 5 minutos, CA-04.3).
export function fetchDocumentUrl(id: string): Promise<BoardResult<{ url: string; expiresIn?: number; requiresAuthentication?: boolean }>> {
  return boardFetch(`${APPLICATIONS_URL}/${encodeURIComponent(id)}/document`);
}
