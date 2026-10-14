// Reglas del documento de respaldo en el navegador (CA-03.3). El servidor vuelve a validar el contenido real.
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_DOCUMENT_TYPES = '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg';

export const DOCUMENT_ERROR_MESSAGES = {
  invalidFile: 'Formato o tamaño no permitido. Adjunta un documento en PDF, PNG o JPG de máximo 5 MB',
  missingFile: 'Adjunta tu documento de respaldo',
  missingType: 'Selecciona el tipo de documento',
} as const;

export type PreviewKind = 'pdf' | 'image';

const EXTENSION_KIND: Record<string, PreviewKind> = {
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
};

const MIME_KIND: Record<string, PreviewKind> = {
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
};

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : '';
}

/**
 * Devuelve el tipo de vista previa si el archivo cumple extension, tipo y tamano;
 * devuelve null si debe rechazarse.
 */
export function getPreviewKind(file: File): PreviewKind | null {
  if (file.size <= 0 || file.size > MAX_DOCUMENT_SIZE_BYTES) return null;
  const byExtension = EXTENSION_KIND[getExtension(file.name)];
  const byMime = MIME_KIND[file.type];
  // Algunos navegadores no informan el tipo: en ese caso decide la extension.
  if (!byExtension || (file.type && byMime !== byExtension)) return null;
  return byExtension;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
