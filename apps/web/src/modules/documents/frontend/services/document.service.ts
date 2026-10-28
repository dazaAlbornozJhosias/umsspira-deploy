import { readApiError } from '@/shared/services/api-contract';

const API_BASE_URL = '/api/v1';

export type DocumentType = 'titulo_provision_nacional' | 'diploma_academico' | 'certificado_egreso';

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'titulo_provision_nacional', label: 'Título en Provisión Nacional' },
  { value: 'diploma_academico', label: 'Diploma Académico' },
  { value: 'certificado_egreso', label: 'Certificado de Egreso' },
];

export interface UploadedDocument {
  path: string;
  tipoDocumento: DocumentType;
  mimeType: 'application/pdf' | 'image/png' | 'image/jpeg';
  sizeBytes: number;
  originalName: string;
}

export interface DocumentFieldError {
  field: string;
  message: string;
}

export type UploadDocumentResult =
  | { ok: true; document: UploadedDocument }
  | { ok: false; status: number; code?: string; message: string; errors: DocumentFieldError[] };

type ApiErrorBody = {
  message?: string | string[];
  code?: string;
  errors?: DocumentFieldError[];
};

export interface UploadDocumentParams {
  sessionToken: string;
  tipoDocumento: DocumentType;
  file: File;
}

// La API valida el documento y devuelve su referencia privada.
export async function uploadDocument({ sessionToken, tipoDocumento, file }: UploadDocumentParams): Promise<UploadDocumentResult> {
  const formData = new FormData();
  formData.append('sessionToken', sessionToken);
  formData.append('tipoDocumento', tipoDocumento);
  formData.append('archivo', file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/documents`, { method: 'POST', body: formData });
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.',
      errors: [],
    };
  }

  let body: ({ data?: UploadedDocument } & ApiErrorBody) | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.ok && body?.data) {
    return { ok: true, document: body.data };
  }

  const detail = readApiError(body, 'No se pudo enviar el documento. Intenta nuevamente.');
  return {
    ok: false,
    status: response.status,
    code: detail.code,
    message: detail.message,
    errors: detail.errors,
  };
}

export interface SubmittedRegistration {
  idSolicitud: string;
  estado: string;
  mensaje: string;
}

export type SubmitRegistrationResult =
  | { ok: true; submission: SubmittedRegistration }
  | { ok: false; status: number; code?: string; message: string; errors: DocumentFieldError[] };

export interface SubmitRegistrationParams {
  sessionToken: string;
  tipoDocumento: DocumentType;
  rutaStorage: string;
  sizeBytes: number;
  mimeType: string;
}

// Envía la referencia del documento ya cargado y de la sesión con correo verificado.
export async function submitRegistration({
  sessionToken,
  tipoDocumento,
  rutaStorage,
  sizeBytes,
  mimeType,
}: SubmitRegistrationParams): Promise<SubmitRegistrationResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/registrations/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, deseaMentor: false, tipoDocumento, rutaStorage, sizeBytes, mimeType }),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'No se pudo conectar con el servidor. Intenta nuevamente en unos minutos.',
      errors: [],
    };
  }

  let body: ({ data?: SubmittedRegistration } & ApiErrorBody) | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.ok && body?.data) {
    return { ok: true, submission: body.data };
  }

  const detail = readApiError(body, 'No se pudo registrar la solicitud. Intenta nuevamente.');
  return {
    ok: false,
    status: response.status,
    code: detail.code,
    message: detail.message,
    errors: detail.errors,
  };
}
