import type { ProfileHeader } from '@/modules/profile/data/profile-data';
import type {
  CertificationRecord,
  EducationRecord,
  ExperienceRecord,
  ProfileRecords,
} from '@/modules/profile/types/profile-record';
import { formatExportDate } from '@/modules/profile/utils/profile-file-name';

export type ProfileJson = {
  idEgresado: string;
  fechaDescarga: string;
  nombre: string;
  carrera: string;
  promocion: number;
  // respaldo: nombre del archivo adjunto, null si no tiene
  // Claves de las secciones con los nombres del Sprint Backlog (HU5-05)
  'Formación académica': { institucion: string; titulo: string; grado: string; anio: number | null; respaldo: string | null }[];
  // periodo: texto del resumen; fechas AAAA-MM-DD, fechaFin null = trabajo actual
  'Experiencia laboral': {
    empresa: string;
    cargo: string;
    periodo: string;
    fechaInicio: string;
    fechaFin: string | null;
  }[];
  Certificaciones: { nombre: string; entidad: string; anio: number | null; grado: string }[];
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** "2021-01-04" -> "Ene 2021"; vacío -> "Presente". */
function formatMonthYear(date: string): string {
  if (!date) return 'Presente';
  const [year, month] = date.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

function toYear(value: string | undefined): number | null {
  const match = value?.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

/** El perfil se puede exportar si al menos una sección tiene registros. */
export function hasProfileBlocks(records: ProfileRecords): boolean {
  return Object.values(records).some((section) => section.length > 0);
}

// Se arma desde los registros del perfil y no desde la línea de tiempo, que no trae todos los datos
export function buildProfileJson(header: ProfileHeader, records: ProfileRecords, date: Date): ProfileJson {
  return {
    idEgresado: header.id,
    fechaDescarga: formatExportDate(date),
    nombre: header.name,
    carrera: header.career,
    promocion: header.graduationYear,
    'Formación académica': (records.education as EducationRecord[]).map((record) => ({
      institucion: record.institution,
      titulo: record.title,
      grado: record.degree,
      anio: toYear(record.graduationYear),
      respaldo: record.backupFile ?? null,
    })),
    'Experiencia laboral': (records.experience as ExperienceRecord[]).map((record) => ({
      empresa: record.company,
      cargo: record.position,
      periodo: `${formatMonthYear(record.startDate)} – ${formatMonthYear(record.endDate)}`,
      fechaInicio: record.startDate,
      fechaFin: record.endDate || null,
    })),
    Certificaciones: (records.certification as CertificationRecord[]).map((record) => ({
      nombre: record.name,
      entidad: record.issuer,
      anio: toYear(record.issueYear),
      grado: record.degree,
    })),
  };
}
