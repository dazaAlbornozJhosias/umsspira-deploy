import type {
  CertificationBackup,
  ProfileRecord,
  ProfileSnapshot,
} from '../../domain/entities/profile-record';
import type { ProfessionalDescription } from '../../domain/entities/professional-description';
import type { BackupLink } from '../../application/use-cases/create-backup-link.use-case';

export function presentDescription(description: ProfessionalDescription) {
  return {
    descripcionProfesional: description.text,
    fechaActualizacion: description.updatedAt?.toISOString() ?? null,
  };
}

export function presentBackup(backup: CertificationBackup) {
  return {
    id: backup.id,
    idCertificacion: backup.certificationId,
    tipo: backup.kind,
    archivoKey: backup.key,
    fechaSubida: backup.uploadedAt?.toISOString() ?? null,
  };
}

export function presentBackupLink(link: BackupLink) {
  const query = new URLSearchParams({
    expira: String(link.expiresAt),
    firma: link.signature,
  });
  return {
    url: `/api/v1/perfil/respaldos/${link.certificationId}/archivo?${query}`,
    expiraEn: new Date(link.expiresAt * 1000).toISOString(),
  };
}

export function presentProfileRecord(record: ProfileRecord) {
  const common = {
    id: record.id,
    idTitulado: record.graduateId,
    fechaCreacion: record.createdAt?.toISOString() ?? null,
  };
  switch (record.kind) {
    case 'education':
      return {
        ...common,
        institucion: record.institution,
        titulo: record.title,
        grado: record.degree,
        anioEgreso: record.graduationYear,
      };
    case 'experience':
      return {
        ...common,
        empresa: record.company,
        cargo: record.position,
        fechaInicio: record.startDate.toISOString().slice(0, 10),
        fechaFin: record.endDate?.toISOString().slice(0, 10) ?? null,
      };
    case 'certification':
      return {
        ...common,
        nombre: record.name,
        entidadEmisora: record.issuer,
        grado: record.degree,
        anioEmision: record.issuedYear,
        respaldo: {
          tieneRespaldo: Boolean(record.backup),
          tipo: record.backup?.kind ?? null,
          fechaSubida: record.backup?.uploadedAt?.toISOString() ?? null,
        },
      };
  }
}

export function presentProfile(profile: ProfileSnapshot) {
  const section = (records: ProfileRecord[]) => ({
    total: records.length,
    registros: records.map(presentProfileRecord),
  });
  return {
    titulado: {
      id: profile.graduate.id,
      nombre: profile.graduate.name,
      carrera: profile.graduate.career,
      promocion: profile.graduate.cohort,
    },
    formacionAcademica: section(profile.education),
    experienciaLaboral: section(profile.experience),
    certificaciones: section(profile.certifications),
    // El resumen y el indicador de completitud del perfil la leen junto con las 3 secciones
    descripcionProfesional: profile.description.text,
  };
}
