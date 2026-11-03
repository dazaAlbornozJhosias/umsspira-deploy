import type { ProfileHeader } from '@/modules/profile/data/profile-data';
import type {
  CertificationRecord,
  EducationRecord,
  ExperienceRecord,
  ProfileRecords,
} from '@/modules/profile/types/profile-record';
import { formatExportDate } from '@/modules/profile/utils/profile-file-name';

export type ProfileJson = {
  // Datos generales con mayúscula inicial, igual que los campos de cada registro
  IdEgresado: string;
  FechaDescarga: string;
  Nombre: string;
  Carrera: string;
  // null = la API todavía no la registra
  Promocion: number | null;
  // respaldo: nombre del archivo adjunto, null si no tiene
  // Claves de las secciones con los nombres del Sprint Backlog (HU5-05)
  'Formación académica': { Institucion: string; Titulo: string; Grado: string; Anio: number | null; Respaldo: string | null }[];
  // periodo: texto del resumen; fechas AAAA-MM-DD, fechaFin null = trabajo actual
  'Experiencia laboral': {
    Empresa: string;
    Cargo: string;
    Periodo: string;
    FechaInicio: string;
    FechaFin: string | null;
  }[];
  Certificaciones: { Nombre: string; Entidad: string; Anio: number | null; Grado: string }[];
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
    IdEgresado: header.id,
    FechaDescarga: formatExportDate(date),
    Nombre: header.name,
    Carrera: header.career,
    Promocion: header.graduationYear,
    'Formación académica': (records.education as EducationRecord[]).map((record) => ({
      Institucion: record.institution,
      Titulo: record.title,
      Grado: record.degree,
      Anio: toYear(record.graduationYear),
      Respaldo: record.backupFile ?? null,
    })),
    'Experiencia laboral': (records.experience as ExperienceRecord[]).map((record) => ({
      Empresa: record.company,
      Cargo: record.position,
      Periodo: `${formatMonthYear(record.startDate)} – ${formatMonthYear(record.endDate)}`,
      FechaInicio: record.startDate,
      FechaFin: record.endDate || null,
    })),
    Certificaciones: (records.certification as CertificationRecord[]).map((record) => ({
      Nombre: record.name,
      Entidad: record.issuer,
      Anio: toYear(record.issueYear),
      Grado: record.degree,
    })),
  };
}
