// Tipos de documento de respaldo aceptados (CA-03.2)
export const DOCUMENT_TYPES = ['titulo_provision_nacional', 'diploma_academico', 'certificado_egreso'] as const;

// Tamano maximo permitido del documento: 5 MB (CA-03.3)
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

// Nombre del campo multipart que contiene el archivo
export const DOCUMENT_FILE_FIELD = 'archivo';

// Bucket privado de Supabase Storage (se puede cambiar con SUPABASE_DOCUMENTS_BUCKET)
export const DEFAULT_DOCUMENTS_BUCKET = 'documentos-respaldo';

// Debe coincidir con la clave que usa el modulo registrations (HU-01) para la sesion temporal
export const registrationSessionKey = (token: string) => `registration-session:${token}`;

export const DOCUMENT_MESSAGES = {
  invalidFile:
    'Formato o tamaño no permitido. Adjunta un documento en PDF, PNG o JPG de máximo 5 MB',
  missingFile: 'Adjunta tu documento de respaldo',
  missingType: 'Selecciona el tipo de documento',
  invalidSession: 'Sesión de registro no válida',
  emailNotVerified: 'Debes verificar tu correo antes de adjuntar tu documento',
  sessionExpired:
    'El tiempo para completar tu registro venció. Debes llenar el formulario desde el inicio.',
  storageUnavailable: 'No se pudo guardar el documento, intenta nuevamente',
  sessionUnavailable: 'No se pudo consultar el registro, intenta nuevamente',
} as const;
