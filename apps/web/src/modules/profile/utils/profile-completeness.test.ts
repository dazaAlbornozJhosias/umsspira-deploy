import { PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';
import type { ProfileRecords } from '@/modules/profile/types/profile-record';

import { completarSeccionHref, profileCompleteness, seccionDeUrl } from './profile-completeness';

const VACIO: ProfileRecords = { education: [], experience: [], certification: [] };

describe('profileCompleteness (T6.5)', () => {
  it('un perfil vacío está al 0% y le faltan las 4 secciones', () => {
    const completitud = profileCompleteness(VACIO, '');

    expect(completitud.percentage).toBe(0);
    expect(completitud.missing.map((seccion) => seccion.label)).toEqual([
      'Formación',
      'Experiencia',
      'Certificaciones',
      'Descripción',
    ]);
  });

  it('cada sección vale 25% y la descripción solo cuenta con texto', () => {
    const conFormacion = { ...VACIO, education: PROFILE_RECORDS_MOCK.education };

    expect(profileCompleteness(conFormacion, '   ').percentage).toBe(25);
    expect(profileCompleteness(conFormacion, 'Analista').percentage).toBe(50);
  });

  it('con registros en las 3 secciones y descripción está al 100% sin faltantes', () => {
    const completitud = profileCompleteness(PROFILE_RECORDS_MOCK, 'Ingeniero de sistemas');

    expect(completitud.percentage).toBe(100);
    expect(completitud.missing).toEqual([]);
  });
});

describe('seccionDeUrl y completarSeccionHref (T6.6)', () => {
  it('solo acepta una de las 4 secciones', () => {
    expect(seccionDeUrl('descripcion-profesional')).toBe('descripcion-profesional');
    expect(seccionDeUrl('otra')).toBeUndefined();
    expect(seccionDeUrl(undefined)).toBeUndefined();
  });

  it('arma el enlace al formulario con el regreso al resumen', () => {
    expect(completarSeccionHref('formacion-academica')).toBe(
      '/profile/completar?seccion=formacion-academica&returnTo=%2Fprofile',
    );
  });
});