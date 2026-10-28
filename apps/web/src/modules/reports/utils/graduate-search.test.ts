import {
  normalizeGraduateSearch,
  searchAndRankGraduates,
} from './graduate-search';

const graduates = [
  { id: 'partial', fullName: 'María Ana Pérez', sisCode: 'SIS-19' },
  { id: 'prefix', fullName: 'Ana Pérez García', sisCode: 'SIS-20' },
  { id: 'exact', fullName: 'Ana Pérez', sisCode: 'SIS-21' },
  { id: 'unrelated', fullName: 'Lucía Ramírez', sisCode: 'SIS-22' },
];

describe('HU-004 QA Bugs 1, 2 y 4: buscador de titulados', () => {
  it('normaliza espacios repetidos, saltos de línea, comas y tildes', () => {
    expect(normalizeGraduateSearch('  Ána,   PéRez \n GARCÍA  '))
      .toBe('ana perez garcia');
  });

  it('da prioridad a las coincidencias exactas sobre iniciales y parciales', () => {
    expect(searchAndRankGraduates(graduates, ' ana,   perez ').map((x) => x.id))
      .toEqual(['exact', 'prefix', 'partial']);
  });

  it('encuentra coincidencias por inicial de palabra y código SIS', () => {
    expect(searchAndRankGraduates(graduates, 'pérez').map((x) => x.id))
      .toEqual(['partial', 'prefix', 'exact']);
    expect(searchAndRankGraduates(graduates, 'SIS-21').map((x) => x.id))
      .toEqual(['exact']);
  });

  it('permite buscar apellido y nombre separados por coma, en otro orden', () => {
    expect(searchAndRankGraduates(graduates, 'Pérez, Ana').map((x) => x.id))
      .toEqual(['partial', 'prefix', 'exact']);
  });

  it('mantiene el orden sin consulta y no inventa coincidencias', () => {
    expect(searchAndRankGraduates(graduates, ',  \t').map((x) => x.id))
      .toEqual(graduates.map((x) => x.id));
    expect(searchAndRankGraduates(graduates, 'desconocido'))
      .toEqual([]);
  });
});
