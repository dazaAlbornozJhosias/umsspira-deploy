import { KeywordExtractorService } from '../src/modules/nlp/application/services/keyword-extractor.service';
import type { DictionaryEntry } from '../src/modules/nlp/domain/entities/dictionary-entry';
import { normalizePhrase } from '../src/modules/nlp/domain/policies/text-normalizer';
import { RADAR_DICTIONARY } from '../src/modules/radar/domain/affinity-catalog';
import { calculateAffinity } from '../src/modules/radar/domain/affinity-calculator';
import type { KeywordAreaWeight } from '../src/modules/radar/domain/entities/affinity-calculation';
import type { RadarArea } from '../src/modules/radar/domain/entities/radar-area';

const definitions = new Map<string, Set<string>>();
const weights: KeywordAreaWeight[] = [];

for (const [area, keywords] of Object.entries(RADAR_DICTIONARY) as [
  RadarArea,
  (typeof RADAR_DICTIONARY)[RadarArea],
][]) {
  for (const keyword of keywords) {
    const canonical = normalizePhrase(keyword.term);
    const aliases = definitions.get(canonical) ?? new Set<string>();
    aliases.add(canonical);
    keyword.aliases?.forEach((alias) => aliases.add(normalizePhrase(alias)));
    definitions.set(canonical, aliases);
    weights.push({ term: canonical, area, weight: keyword.weight });
  }
}

const dictionary: DictionaryEntry[] = [...definitions].map(([canonical, aliases]) => ({
  canonical,
  aliases: [...aliases].filter((alias) => alias !== canonical),
}));
const extractor = new KeywordExtractorService();
const dictionaryReport = extractor.loadDictionary(dictionary);
const softwareKeywords =
  'javascript typescript node.js react angular desarrollo de software arquitectura de software java python sql postgresql api rest c++ c# spring boot backend frontend git';

const profiles = [
  { name: 'alias corto JS', text: 'JS', expected: { 'software-development': 5 } },
  { name: 'canónica JavaScript', text: 'JavaScript', expected: { 'software-development': 5 } },
  {
    name: 'keyword canónica de varias palabras',
    text: 'desarrollo de software',
    expected: { 'software-development': 5 },
  },
  { name: 'alias de varias palabras', text: 'rest api', expected: { 'software-development': 4 } },
  { name: 'alias ML', text: 'ML', expected: { 'data-ai': 5 } },
  {
    name: 'frecuencia limitada a tres',
    text: 'javascript javascript javascript javascript javascript',
    expected: { 'software-development': 15 },
  },
  {
    name: 'saturación del puntaje a cien',
    text: `${softwareKeywords} ${softwareKeywords} ${softwareKeywords}`,
    expected: { 'software-development': 100, 'cloud-devops': 6, 'data-ai': 33 },
  },
  { name: 'perfil sin keywords', text: '', expected: {} },
  {
    name: 'Node.js no se confunde con JavaScript',
    text: 'Node.js',
    expected: { 'software-development': 5 },
  },
  {
    name: 'Node.js y JavaScript son keywords independientes',
    text: 'Node.js JavaScript',
    expected: { 'software-development': 10 },
  },
  {
    name: 'Python aporta con su peso propio a cada área',
    text: 'Python',
    expected: { 'software-development': 3, 'data-ai': 4 },
  },
  {
    name: 'Git aporta de manera independiente a dos áreas',
    text: 'Git',
    expected: { 'software-development': 2, 'cloud-devops': 2 },
  },
  {
    name: 'lista top ordenada y limitada a cinco keywords',
    text: 'javascript typescript node.js react angular java',
    expected: { 'software-development': 28 },
  },
] as const;

describe('criterios de aceptación de perfiles con el diccionario real', () => {
  it('construye el diccionario de 89 claves normalizadas del seed (canónicas y aliases)', () => {
    expect(dictionaryReport.loaded).toBe(89);
  });

  it.each(profiles)('$name', ({ text, expected }) => {
    const extracted = extractor.extract(text);
    const scores = calculateAffinity(extracted.keywords, weights);
    const actual = Object.fromEntries(
      scores.filter(({ score }) => score > 0).map(({ area, score }) => [area, score]),
    );

    expect(actual).toEqual(expected);
    expect(
      scores.every(
        ({ score, percentage }) =>
          score >= 0 &&
          score <= 100 &&
          percentage >= 0 &&
          percentage <= 100 &&
          Math.round(percentage * 100) / 100 === percentage,
      ),
    ).toBe(true);
  });

  it('devuelve porcentaje con precisión de dos decimales y el máximo peso reconocido', () => {
    const extracted = extractor.extract('JavaScript');
    const software = calculateAffinity(extracted.keywords, weights).find(
      ({ area }) => area === 'software-development',
    );

    expect(software).toMatchObject({ score: 5, percentage: 2.38, weighting: 5 });
  });

  it('devuelve el mayor peso reconocido por área y null si no hay coincidencias', () => {
    const extracted = extractor.extract('Python');
    const scores = calculateAffinity(extracted.keywords, weights);

    expect(scores.find(({ area }) => area === 'software-development')?.weighting).toBe(3);
    expect(scores.find(({ area }) => area === 'data-ai')?.weighting).toBe(4);
    expect(scores.find(({ area }) => area === 'quality-assurance')?.weighting).toBeNull();
  });

  it('conserva top keywords por aporte y limita la lista a cinco', () => {
    const extracted = extractor.extract(profiles[12].text);
    const software = calculateAffinity(extracted.keywords, weights).find(
      ({ area }) => area === 'software-development',
    );

    expect(software?.topKeywords).toHaveLength(5);
    expect(software?.topKeywords.map(({ term }) => term)).toEqual([
      'javascript',
      'node.js',
      'react',
      'typescript',
      'angular',
    ]);
  });

  it('no genera puntaje para texto sin correspondencia en el diccionario', () => {
    const extracted = extractor.extract('xylophone');
    const scores = calculateAffinity(extracted.keywords, weights);

    expect(extracted.unmapped).toContainEqual({ term: 'xylophone', count: 1 });
    expect(scores.every(({ score }) => score === 0)).toBe(true);
  });
});
