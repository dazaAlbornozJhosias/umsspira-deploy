import type {
  FormacionAcademica,
  ExperienciaLaboral,
  Certificacion,
  CertificacionRespaldo,
  PerfilArea,
} from '../../../../generated/prisma/client';
import type {
  CertificationBackup,
  CertificationRecord,
  EducationRecord,
  ExperienceRecord,
} from '../../domain/entities/profile-record';
import type { ProfessionalDescription } from '../../domain/entities/professional-description';

export function toEducation(row: FormacionAcademica): EducationRecord {
  return {
    kind: 'education',
    id: row.id,
    graduateId: row.id_titulado,
    createdAt: row.fecha_creacion,
    institution: row.institucion,
    title: row.titulo,
    degree: row.grado,
    graduationYear: row.anio_egreso,
  };
}

export function toExperience(row: ExperienciaLaboral): ExperienceRecord {
  return {
    kind: 'experience',
    id: row.id,
    graduateId: row.id_titulado,
    createdAt: row.fecha_creacion,
    company: row.empresa,
    position: row.cargo,
    startDate: row.fecha_inicio,
    endDate: row.fecha_fin,
  };
}

export function toBackup(row: CertificacionRespaldo): CertificationBackup {
  return {
    id: row.id,
    certificationId: row.id_certificacion,
    kind: row.tipo,
    key: row.archivo_key,
    uploadedAt: row.fecha_subida,
  };
}

export function toCertification(
  row: Certificacion & { certificacion_respaldo_registros?: CertificacionRespaldo[] },
): CertificationRecord {
  return {
    kind: 'certification',
    id: row.id,
    graduateId: row.id_titulado,
    createdAt: row.fecha_creacion,
    name: row.nombre,
    issuer: row.entidad_emisora,
    degree: row.grado,
    issuedYear: row.anio_emision,
    backup: row.certificacion_respaldo_registros?.[0]
      ? toBackup(row.certificacion_respaldo_registros[0])
      : null,
  };
}

// Sin fila en perfil_area el titulado aún no registró su descripción
export function toDescription(
  row: Pick<PerfilArea, 'descripcion_profesional' | 'fecha_actualizacion'> | null | undefined,
): ProfessionalDescription {
  return {
    text: row?.descripcion_profesional ?? '',
    updatedAt: row?.fecha_actualizacion ?? null,
  };
}
