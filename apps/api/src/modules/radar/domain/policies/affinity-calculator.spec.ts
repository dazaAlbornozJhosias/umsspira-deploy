import {
  calculateAreaAffinity,
  normalizeTopKeywords,
  type AreaKeywordWeight,
  type KeywordMatch,
} from './affinity-calculator';
import { MAX_POSSIBLE_SCORE, TOP_FREQUENCY, TOP_KEYWORDS_LIMIT } from './affinity-config';

const softwareWeights: AreaKeywordWeight[] = [
  { term: 'javascript', peso: 5 },
  { term: 'typescript', peso: 5 },
  { term: 'node.js', peso: 5 },
  { term: 'react', peso: 5 },
  { term: 'angular', peso: 4 },
  { term: 'java', peso: 4 },
  { term: 'python', peso: 3 },
  { term: 'git', peso: 2 },
];

const dataWeights: AreaKeywordWeight[] = [
  { term: 'python', peso: 4 },
  { term: 'machine learning', peso: 5 },
];

function keyword(term: string, count = 1): KeywordMatch {
  return { term, count };
}

describe('calculateAreaAffinity - keywords influyentes (HU-8)', () => {
  it('limita la lista a cinco keywords cuando hay mas candidatas', () => {
    const result = calculateAreaAffinity(
      softwareWeights.map(({ term }) => keyword(term, 1)),
      softwareWeights,
    );

    expect(result.palabrasClaveTop).toHaveLength(TOP_KEYWORDS_LIMIT);
    expect(result.palabrasClaveTop).toHaveLength(5);
  });

  it('ordena de mayor a menor aporte y desempata alfabeticamente', () => {
    const result = calculateAreaAffinity(
      [keyword('javascript', 3), keyword('typescript', 1), keyword('react', 1), keyword('git', 3)],
      softwareWeights,
    );

    expect(result.palabrasClaveTop.map(({ keyword: term, points }) => [term, points])).toEqual([
      ['javascript', 15],
      ['git', 6],
      ['react', 5],
      ['typescript', 5],
    ]);
  });

  it('excluye aportes no positivos y no repite la misma keyword', () => {
    const result = calculateAreaAffinity(
      [keyword('javascript', 0), keyword('typescript', 2), keyword('typescript', 2)],
      softwareWeights,
    );

    expect(result.palabrasClaveTop).toEqual([
      { keyword: 'typescript', weight: 5, frequency: 2, points: 10, percentage: 25 },
    ]);
    expect(result.puntaje).toBe(10);
  });

  it('calcula points con el tope de frecuencia y conserva la frecuencia real', () => {
    const result = calculateAreaAffinity([keyword('javascript', 5)], softwareWeights);

    expect(result.palabrasClaveTop).toEqual([
      {
        keyword: 'javascript',
        weight: 5,
        frequency: 5,
        points: 5 * TOP_FREQUENCY,
        percentage: (5 * TOP_FREQUENCY * 100) / MAX_POSSIBLE_SCORE,
      },
    ]);
    expect(result.puntaje).toBe(15);
    expect(result.porcentaje).toBe(37.5);
    expect(result.ponderacion).toBe(5);
  });

  it('una keyword multiarea aparece en cada area con el peso propio de esa area', () => {
    const software = calculateAreaAffinity([keyword('python', 2)], softwareWeights);
    const data = calculateAreaAffinity([keyword('python', 2)], dataWeights);

    expect(software.palabrasClaveTop[0]).toMatchObject({ keyword: 'python', weight: 3, points: 6 });
    expect(data.palabrasClaveTop[0]).toMatchObject({ keyword: 'python', weight: 4, points: 8 });
  });

  it('devuelve lista vacia y ponderacion null cuando no hay aportes', () => {
    const result = calculateAreaAffinity([], softwareWeights);
    const unrelated = calculateAreaAffinity([keyword('machine learning', 3)], softwareWeights);

    expect(result).toMatchObject({
      puntaje: 0,
      porcentaje: 0,
      ponderacion: null,
      palabrasClaveTop: [],
    });
    expect(unrelated).toMatchObject({
      puntaje: 0,
      porcentaje: 0,
      ponderacion: null,
      palabrasClaveTop: [],
    });
  });

  it('nunca incluye una keyword de otra area', () => {
    const result = calculateAreaAffinity(
      [keyword('machine learning', 3), keyword('python', 1)],
      softwareWeights,
    );

    expect(result.palabrasClaveTop.map(({ keyword: term }) => term)).toEqual(['python']);
  });

  it('satura el porcentaje del area a cien sin recortar el detalle de aportes', () => {
    const result = calculateAreaAffinity(
      softwareWeights.map(({ term }) => keyword(term, 3)),
      softwareWeights,
    );

    expect(result.puntaje).toBeGreaterThan(MAX_POSSIBLE_SCORE);
    expect(result.porcentaje).toBe(100);
    expect(result.palabrasClaveTop).toHaveLength(5);
  });
});

describe('normalizeTopKeywords - instantaneas persistidas', () => {
  it('devuelve arreglo vacio para null o valores invalidos', () => {
    expect(normalizeTopKeywords(null)).toEqual([]);
    expect(normalizeTopKeywords(undefined)).toEqual([]);
    expect(normalizeTopKeywords('javascript')).toEqual([]);
    expect(normalizeTopKeywords([{ term: 'javascript', contribution: 5 }])).toEqual([]);
  });

  it('recalcula el porcentaje, elimina repetidos y recorta a cinco', () => {
    const snapshot = [
      { keyword: 'java', weight: 4, frequency: 1, points: 4, percentage: 999 },
      { keyword: 'javascript', weight: 5, frequency: 3, points: 15, percentage: 0 },
      { keyword: 'javascript', weight: 5, frequency: 2, points: 10, percentage: 0 },
      { keyword: 'python', weight: 0, frequency: 1, points: 0, percentage: 0 },
      { keyword: 'react', weight: 5, frequency: 1, points: 5, percentage: 0 },
      { keyword: 'node.js', weight: 5, frequency: 1, points: 5, percentage: 0 },
      { keyword: 'typescript', weight: 5, frequency: 1, points: 5, percentage: 0 },
      { keyword: 'angular', weight: 4, frequency: 1, points: 4, percentage: 0 },
    ];

    const result = normalizeTopKeywords(snapshot);

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({
      keyword: 'javascript',
      weight: 5,
      frequency: 3,
      points: 15,
      percentage: 37.5,
    });
    expect(result.filter(({ keyword: term }) => term === 'javascript')).toHaveLength(1);
    expect(result.some(({ keyword: term }) => term === 'python')).toBe(false);
    expect(result.map(({ keyword: term }) => term)).toEqual([
      'javascript',
      'node.js',
      'react',
      'typescript',
      'angular',
    ]);
  });
});
