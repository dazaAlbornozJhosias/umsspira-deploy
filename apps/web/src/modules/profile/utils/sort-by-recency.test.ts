import { profileTimeline } from '@/modules/profile/data/profile-data';
import type { TimelineSection } from '@/modules/profile/data/profile-data';

import { sortSectionsByRecency } from './sort-by-recency';

function titlesOf(sections: TimelineSection[], title: string) {
  return sections.find((section) => section.title === title)?.items.map((item) => item.title);
}

describe('sortSectionsByRecency', () => {
  const sorted = sortSectionsByRecency(profileTimeline);

  it('ordena la formación académica del año más reciente al más antiguo', () => {
    expect(titlesOf(sorted, 'FORMACIÓN ACADÉMICA')).toEqual([
      'Universidad Católica Boliviana',
      'Universidad Mayor de San Simón',
    ]);
  });

  it('pone primero la experiencia con "Presente"', () => {
    expect(titlesOf(sorted, 'EXPERIENCIA LABORAL')).toEqual([
      'NTT DATA',
      'Jalasoft',
      'Banco Mercantil Santa Cruz',
    ]);
  });

  it('ordena las certificaciones por el año del subtítulo', () => {
    expect(titlesOf(sorted, 'CERTIFICACIONES')).toEqual([
      'Google Cloud Engineer',
      'AWS Solutions Architect',
      'Scrum Master PSM I',
    ]);
  });

  it('compara meses dentro del mismo año y deja al final los ítems sin fecha', () => {
    const sections: TimelineSection[] = [
      {
        title: 'EXPERIENCIA LABORAL',
        items: [
          { title: 'Sin fecha', subtitle: 'Pasantía' },
          { title: 'Enero', subtitle: 'A', date: 'Ene 2020 – Mar 2020' },
          { title: 'Diciembre', subtitle: 'B', date: 'Abr 2020 – Dic 2020' },
        ],
      },
    ];
    expect(titlesOf(sortSectionsByRecency(sections), 'EXPERIENCIA LABORAL')).toEqual([
      'Diciembre',
      'Enero',
      'Sin fecha',
    ]);
  });

  it('usa el año de la certificación aunque la entidad tenga números', () => {
    const sections: TimelineSection[] = [
      {
        title: 'CERTIFICACIONES',
        items: [
          { title: 'Auditor ISO', subtitle: 'ISO 9001 · 2019', year: '2019' },
          { title: 'Scrum', subtitle: 'Scrum.org · 2021', year: '2021' },
        ],
      },
    ];
    expect(titlesOf(sortSectionsByRecency(sections), 'CERTIFICACIONES')).toEqual(['Scrum', 'Auditor ISO']);
  });

  it('no modifica los datos originales', () => {
    expect(profileTimeline[0].items[0].title).toBe('Universidad Mayor de San Simón');
  });
});
