import type {
  BorradorRegistro,
  ArchivoRegistro,
  Prisma,
} from '../../../../generated/prisma/client';
import type {
  RegistrationData,
  RegistrationDraft,
  RegistrationFile,
} from '../../domain/entities/registration';

export function toRegistrationDraft(row: BorradorRegistro): RegistrationDraft {
  // Solo el servidor escribe este JSON después de validar el formulario.
  return {
    id: row.id,
    data: row.datos as unknown as RegistrationData,
    expiresAt: row.expira_en,
    verified: row.correo_verificado,
    applicationId: row.id_solicitud,
  };
}

export function toRegistrationFile(row: ArchivoRegistro): RegistrationFile {
  return {
    id: row.id,
    draftId: row.id_borrador,
    documentType: row.tipo_documento,
    name: row.nombre,
    mime: row.mime,
    bytes: row.contenido,
    size: row.size_bytes,
  };
}

export const applicationInclude = {
  detalle_solicitud: { include: { carrera: true } },
  registro: { include: { archivo: { select: { id: true, nombre: true, mime: true } } } },
} satisfies Prisma.SolicitudInclude;
