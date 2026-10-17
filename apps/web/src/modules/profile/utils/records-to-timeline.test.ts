import { PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';

import { recordsToTimeline } from './records-to-timeline';

describe('recordsToTimeline', () => {
  const [education, experience, certifications] = recordsToTimeline(PROFILE_RECORDS_MOCK);

  it('arma las 3 secciones con los datos de prueba únicos', () => {
    expect(education.title).toBe('FORMACIÓN ACADÉMICA');
    expect(experience.title).toBe('EXPERIENCIA LABORAL');
    expect(certifications.title).toBe('CERTIFICACIONES');
    expect(education.items).toHaveLength(PROFILE_RECORDS_MOCK.education.length);
  });

  it('muestra el periodo de experiencia con "Presente" para el trabajo actual', () => {
    expect(experience.items[0]).toMatchObject({ title: 'NTT DATA', date: 'Jul 2023 – Presente' });
    expect(experience.items[1].date).toBe('Ene 2021 – Jun 2023');
  });

  it('marca el estado del respaldo de cada certificación', () => {
    expect(certifications.items.map((item) => item.status)).toEqual(['verified', 'verified', 'missing']);
  });

  it('deja en revisión un respaldo subido que aún no fue validado', () => {
    const [, , certs] = recordsToTimeline({
      ...PROFILE_RECORDS_MOCK,
      certification: [
        { id: 'c', ownerId: 'g', name: 'Nueva', issuer: 'Entidad', degree: 'Asociado', issueYear: '2024', backupFile: 'cert.pdf', backupVerified: false },
      ],
    });
    expect(certs.items[0]).toMatchObject({ status: 'pending', document: 'cert.pdf', subtitle: 'Entidad · 2024' });
  });
});
