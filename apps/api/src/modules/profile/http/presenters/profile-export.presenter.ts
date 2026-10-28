import type { ProfileSnapshot } from '../../domain/entities/profile-record';
import { presentProfile } from './profile.presenter';

export function presentProfileExport(profile: ProfileSnapshot, exportedAt: Date) {
  const name =
    (profile.graduate.name ?? 'titulado')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'titulado';
  const date = exportedAt.toISOString().slice(0, 10);
  const { titulado, formacionAcademica, experienciaLaboral, certificaciones } =
    presentProfile(profile);
  // HU5-05: las secciones usan los nombres del Sprint Backlog, igual que la descarga del frontend
  const document = {
    fechaExportacion: date,
    titulado,
    'Formación académica': formacionAcademica,
    'Experiencia laboral': experienciaLaboral,
    Certificaciones: certificaciones,
  };
  return {
    name: 'perfil_' + name + '_' + date + '.json',
    content: JSON.stringify(document, null, 2),
  };
}
