import { PROFILE_RECORDS_MOCK, profileHeader } from '@/modules/profile/testing/profile-fixtures';
import type { ProfileRecords } from '@/modules/profile/types/profile-record';

import { buildProfileJson, hasProfileBlocks } from './build-profile-json';

describe('build-profile-json', () => {
  const date = new Date(2026, 9, 2);

  it('arma el JSON con los campos del perfil', () => {
    const json = buildProfileJson(profileHeader, PROFILE_RECORDS_MOCK, date);

    expect(json).toMatchObject({
      IdEgresado: '000452',
      FechaDescarga: '2026-10-02',
      Nombre: 'Carlos Mendoza Ríos',
      Carrera: 'Ingeniería de Sistemas',
      Promocion: 2018,
    });
    expect(json['Formación académica'][0]).toEqual({
      Institucion: 'Universidad Mayor de San Simón',
      Titulo: 'Licenciatura en Ingeniería de Sistemas',
      Grado: 'Licenciatura',
      Anio: 2018,
      Respaldo: 'respaldo.jpg',
    });
    expect(json['Experiencia laboral']).toHaveLength(3);
    expect(json['Experiencia laboral'][0]).toEqual({
      Empresa: 'NTT DATA',
      Cargo: 'Tech Lead',
      Periodo: 'Jul 2023 – Presente',
      FechaInicio: '2023-07-01',
      FechaFin: null,
    });
    expect(json['Experiencia laboral'][1]).toEqual({
      Empresa: 'Jalasoft',
      Cargo: 'Desarrollador Senior',
      Periodo: 'Ene 2021 – Jun 2023',
      FechaInicio: '2021-01-04',
      FechaFin: '2023-06-30',
    });
    expect(json.Certificaciones[0]).toEqual({
      Nombre: 'AWS Solutions Architect',
      Entidad: 'Amazon Web Services',
      Anio: 2022,
      Grado: 'Profesional',
    });
  });

  const empty: ProfileRecords = { education: [], experience: [], certification: [] };

  it('exporta respaldo null en una formación sin archivo adjunto', () => {
    const records: ProfileRecords = {
      ...PROFILE_RECORDS_MOCK,
      education: [{ ...PROFILE_RECORDS_MOCK.education[0], backupFile: undefined }],
    };

    expect(buildProfileJson(profileHeader, records, date)['Formación académica'][0].Respaldo).toBeNull();
  });

  it('devuelve listas vacías cuando las secciones no tienen registros', () => {
    const json = buildProfileJson(profileHeader, empty, date);

    expect(json['Formación académica']).toEqual([]);
    expect(json['Experiencia laboral']).toEqual([]);
    expect(json.Certificaciones).toEqual([]);
  });

  it('detecta si el perfil tiene al menos un bloque con registros', () => {
    expect(hasProfileBlocks(PROFILE_RECORDS_MOCK)).toBe(true);
    expect(hasProfileBlocks(empty)).toBe(false);
  });
});
