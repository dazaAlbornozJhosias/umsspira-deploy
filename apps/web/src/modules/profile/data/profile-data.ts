import { PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';
import { recordsToTimeline } from '@/modules/profile/utils/records-to-timeline';

// verified = validado por la administración, pending = subido y en revisión
export type BackupStatus = 'verified' | 'pending' | 'missing';

export type TimelineItem = {
  // Id del registro; el visor de respaldos lo usa para pedir el enlace firmado
  id?: string;
  title: string;
  subtitle: string;
  date?: string;
  detail?: string;
  document?: string;
  // Dirección del archivo de respaldo; sin ella el documento se muestra sin enlace
  documentUrl?: string;
  status?: BackupStatus;
  // Solo certificaciones. Se reemplazan por el tipo de lectura de shared-types cuando exista.
  issuer?: string;
  year?: string;
  grade?: string;
};

export type TimelineSection = {
  title: string;
  dateTone?: 'accent' | 'muted';
  items: TimelineItem[];
};

export type ProfileHeader = {
  id: string;
  title: string;
  name: string;
  career: string;
  graduationYear: number;
  verified: boolean;
};

export const profileHeader: ProfileHeader = {
  id: '000452',
  title: 'Ing.',
  name: 'Carlos Mendoza Ríos',
  career: 'Ingeniería de Sistemas',
  graduationYear: 2018,
  verified: true,
};

// Línea de tiempo de los datos de prueba únicos (profile-records-data.ts)
export const profileTimeline: TimelineSection[] = recordsToTimeline(PROFILE_RECORDS_MOCK);
