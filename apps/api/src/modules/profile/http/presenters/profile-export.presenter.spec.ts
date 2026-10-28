import type { ProfileSnapshot } from '../../domain/entities/profile-record';
import { presentProfileExport } from './profile-export.presenter';

const profile: ProfileSnapshot = {
  graduate: { id: 't1', name: 'Carlos Mendoza Ríos', career: null, cohort: null },
  education: [],
  experience: [],
  certifications: [],
  description: { text: '', updatedAt: null },
};

describe('presentProfileExport (HU5-05)', () => {
  it('nombra las secciones como en el Sprint Backlog', () => {
    const file = presentProfileExport(profile, new Date('2026-10-22T12:00:00Z'));
    const json = JSON.parse(file.content);

    expect(file.name).toBe('perfil_carlos_mendoza_rios_2026-10-22.json');
    expect(Object.keys(json)).toEqual([
      'fechaExportacion',
      'titulado',
      'Formación académica',
      'Experiencia laboral',
      'Certificaciones',
    ]);
    expect(json['Formación académica']).toEqual({ total: 0, registros: [] });
    expect(json['Experiencia laboral']).toEqual({ total: 0, registros: [] });
    expect(json.Certificaciones).toEqual({ total: 0, registros: [] });
  });

  it('usa indentación de 2 espacios', () => {
    const { content } = presentProfileExport(profile, new Date('2026-10-22T12:00:00Z'));
    expect(content).toBe(JSON.stringify(JSON.parse(content), null, 2));
  });
});
