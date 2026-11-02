import { searchAndRankGraduates } from './graduate-search';

// Casos exactos del reporte de QA (HU-2 · segunda corrida · bugs 1, 2 y 4).
const graduates = [
  { fullName: 'Arce Baldivieso, Luciana Belén', sisCode: '201903490' },
  { fullName: 'Paz Soldán, Mariana Elena', sisCode: '201907723' },
  { fullName: 'Villarroel Antezana, Ana Gabriela', sisCode: '201702290' },
  { fullName: 'Calle Tapia, Gisela Ana', sisCode: '201884439' },
  { fullName: 'Morales Albarracín, Valeria Sofía', sisCode: '201804921' },
];

describe('Buscador de titulados · casos de QA', () => {
  it('Bug 1: "Ana" muestra primero las coincidencias directas', () => {
    const names = searchAndRankGraduates(graduates, 'Ana').map((g) => g.fullName);
    expect(names.slice(0, 2)).toEqual([
      'Villarroel Antezana, Ana Gabriela',
      'Calle Tapia, Gisela Ana',
    ]);
    expect(names.indexOf('Arce Baldivieso, Luciana Belén')).toBeGreaterThan(1);
  });

  it.each([
    'Morales Albarracín, Valeria Sofía',
    'Morales Albarracin Valeria Sofia',
    'Valeria Sofia Morales Albarracin',
    'Valeria Sofía, Morales Albarracín',
  ])('Bug 2: encuentra al titulado con "%s"', (query) => {
    const result = searchAndRankGraduates(graduates, query);
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Morales Albarracín, Valeria Sofía');
  });

  it('Bug 4: espacios repetidos dan el mismo resultado que un solo espacio', () => {
    const withSingle = searchAndRankGraduates(graduates, 'Mariana Elena');
    const withDouble = searchAndRankGraduates(graduates, 'Mariana' + ' '.repeat(4) + 'Elena');
    expect(withSingle).toHaveLength(1);
    expect(withDouble).toEqual(withSingle);
  });
});
