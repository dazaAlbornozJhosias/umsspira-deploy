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

// Datos del titulado con sesión que devuelve GET /api/v1/perfil; vacío = la API no lo tiene registrado
export type ProfileHeader = {
  id: string;
  name: string;
  career: string;
  graduationYear: number | null;
};
