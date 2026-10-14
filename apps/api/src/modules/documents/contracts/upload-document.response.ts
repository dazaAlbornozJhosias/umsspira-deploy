import { DOCUMENT_TYPES } from './document.constants';

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type DocumentMimeType = 'application/pdf' | 'image/png' | 'image/jpeg';

// Respuesta de POST /documents: archivo guardado en el bucket privado de Supabase Storage
export interface UploadDocumentResponse {
  path: string;
  tipoDocumento: DocumentType;
  mimeType: DocumentMimeType;
  sizeBytes: number;
  originalName: string;
}
