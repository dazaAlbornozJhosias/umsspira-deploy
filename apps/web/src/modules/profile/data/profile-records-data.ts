import { SAMPLE_BACKUP_URL } from '@/modules/profile/utils/backup-url';
import type { ProfileRecords, RecordSection } from '@/modules/profile/types/profile-record';

// Egresado con sesión iniciada (temporal hasta integrar la autenticación)
export const CURRENT_GRADUATE_ID = 'graduate-000452';

// Datos de prueba únicos del perfil: los usan el resumen, el formulario, "Mis registros",
// la edición y la descarga en JSON. Se reemplazan por la API cuando exista el backend.
export const PROFILE_RECORDS_MOCK: ProfileRecords = {
  education: [
    {
      id: 'edu-1',
      ownerId: CURRENT_GRADUATE_ID,
      institution: 'Universidad Mayor de San Simón',
      title: 'Licenciatura en Ingeniería de Sistemas',
      graduationYear: '2018',
      degree: 'Licenciatura',
      backupFile: 'respaldo.pdf',
      backupUrl: SAMPLE_BACKUP_URL,
    },
    {
      id: 'edu-2',
      ownerId: CURRENT_GRADUATE_ID,
      institution: 'Universidad Católica Boliviana',
      title: 'Maestría en Gestión de TI',
      graduationYear: '2021',
      degree: 'Maestría',
      backupFile: 'respaldo.pdf',
      backupUrl: SAMPLE_BACKUP_URL,
    },
  ],
  experience: [
    {
      id: 'exp-1',
      ownerId: CURRENT_GRADUATE_ID,
      company: 'NTT DATA',
      position: 'Tech Lead',
      startDate: '2023-07-01',
      endDate: '',
    },
    {
      id: 'exp-2',
      ownerId: CURRENT_GRADUATE_ID,
      company: 'Jalasoft',
      position: 'Desarrollador Senior',
      startDate: '2021-01-04',
      endDate: '2023-06-30',
    },
    {
      id: 'exp-3',
      ownerId: CURRENT_GRADUATE_ID,
      company: 'Banco Mercantil Santa Cruz',
      position: 'Analista de Sistemas',
      startDate: '2019-01-07',
      endDate: '2020-12-31',
    },
  ],
  certification: [
    {
      id: 'cert-1',
      ownerId: CURRENT_GRADUATE_ID,
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      degree: 'Profesional',
      issueYear: '2022',
      backupFile: 'respaldo.pdf',
      backupUrl: SAMPLE_BACKUP_URL,
      backupVerified: true,
    },
    {
      id: 'cert-2',
      ownerId: CURRENT_GRADUATE_ID,
      name: 'Scrum Master PSM I',
      issuer: 'Scrum.org',
      degree: 'Asociado',
      issueYear: '2021',
      backupFile: 'respaldo.pdf',
      backupUrl: SAMPLE_BACKUP_URL,
      backupVerified: true,
    },
    {
      id: 'cert-3',
      ownerId: CURRENT_GRADUATE_ID,
      name: 'Google Cloud Engineer',
      issuer: 'Google',
      degree: 'Profesional',
      issueYear: '2023',
    },
  ],
};

// "Mis registros" abierto en una pestaña (para volver a la sección desde la que se editó)
export function recordsHref(section: RecordSection): string {
  return `/profile/records?seccion=${section}`;
}

export function toRecordSection(value: string | undefined): RecordSection {
  return value === 'experience' || value === 'certification' ? value : 'education';
}

export const SECTION_LABELS: Record<RecordSection, string> = {
  education: 'Educación',
  experience: 'Experiencia',
  certification: 'Certificaciones',
};
