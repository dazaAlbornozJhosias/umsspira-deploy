import type { TimelineItem, TimelineSection } from '@/modules/profile/data/profile-data';
import type {
  CertificationRecord,
  EducationRecord,
  ExperienceRecord,
  ProfileRecords,
} from '@/modules/profile/types/profile-record';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** "2021-01-04" -> "Ene 2021"; vacío -> "Presente". */
function formatMonthYear(date: string): string {
  if (!date) return 'Presente';
  const [year, month] = date.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

function educationItem(record: EducationRecord): TimelineItem {
  return {
    title: record.institution,
    subtitle: record.title,
    date: record.graduationYear,
    document: record.backupFile,
    documentUrl: record.backupUrl,
  };
}

function experienceItem(record: ExperienceRecord): TimelineItem {
  return {
    title: record.company,
    subtitle: record.position,
    date: `${formatMonthYear(record.startDate)} – ${formatMonthYear(record.endDate)}`,
  };
}

function certificationItem(record: CertificationRecord): TimelineItem {
  let status: TimelineItem['status'] = 'missing';
  if (record.backupFile) status = record.backupVerified ? 'verified' : 'pending';

  return {
    id: record.id,
    title: record.name,
    subtitle: `${record.issuer} · ${record.issueYear}`,
    detail: `Grado: ${record.degree}`,
    issuer: record.issuer,
    year: record.issueYear,
    grade: record.degree,
    document: record.backupFile,
    documentUrl: record.backupUrl,
    status,
  };
}

/** Convierte los registros del perfil (fuente única de datos) en las secciones de la línea de tiempo. */
export function recordsToTimeline(records: ProfileRecords): TimelineSection[] {
  return [
    {
      title: 'FORMACIÓN ACADÉMICA',
      dateTone: 'accent',
      items: (records.education as EducationRecord[]).map(educationItem),
    },
    {
      title: 'EXPERIENCIA LABORAL',
      dateTone: 'muted',
      items: (records.experience as ExperienceRecord[]).map(experienceItem),
    },
    {
      title: 'CERTIFICACIONES',
      items: (records.certification as CertificationRecord[]).map(certificationItem),
    },
  ];
}
