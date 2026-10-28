import { RADAR_DICTIONARY, validateRadarDictionary } from '../scripts/seed/radar-catalog';
import { KeywordExtractorService } from '../src/modules/nlp/application/services/keyword-extractor.service';
import { normalizePhrase } from '../src/modules/nlp/domain/policies/text-normalizer';

describe('Catálogo real del Anexo B', () => {
  const entries = new Map<string, Set<string>>();
  for (const definitions of Object.values(RADAR_DICTIONARY)) {
    for (const definition of definitions) {
      const term = normalizePhrase(definition.term);
      const aliases = entries.get(term) ?? new Set<string>([term]);
      for (const alias of definition.aliases ?? []) {
        aliases.add(normalizePhrase(alias));
      }
      entries.set(term, aliases);
    }
  }
  const service = new KeywordExtractorService();

  beforeAll(() => {
    validateRadarDictionary();
    const report = service.loadDictionary(
      [...entries].map(([canonical, aliases]) => ({ canonical, aliases: [...aliases] })),
    );
    expect(report.ignored).toEqual([]);
    expect(report.loaded).toBe(89);
  });

  it('distingue 66 identidades canónicas de 23 variantes de alias', () => {
    expect(entries.size).toBe(66);
    expect([...entries.values()].reduce((sum, aliases) => sum + aliases.size, 0)).toBe(89);
  });

  it.each([
    ['Gobierno de TI', ['gobierno de ti']],
    ['Ciencia de datos y análisis de datos', ['analisis de datos', 'ciencia de datos']],
    ['Gestión de proyectos', ['gestion de proyectos']],
    ['Liderazgo de equipos', ['liderazgo de equipos']],
    ['Gestión de proyectos de TI', ['gestion de proyectos']],
    ['gobierno de\nti', []],
  ])('extrae las frases completas de %s', (text, expected) => {
    const result = service.extract(text as string);
    expect(result.keywords.map((keyword) => keyword.term)).toEqual(expected);
    expect(result.keywords.every((keyword) => keyword.count === 1)).toBe(true);
    expect(result.unmapped.map((keyword) => keyword.term)).not.toContain('de');
    expect(result.unmapped.map((keyword) => keyword.term)).not.toContain('ti');
  });

  it('conserva experiencia como candidata y excluye de', () => {
    const result = service.extract('Experiencia de varios años');
    expect(result.keywords).toEqual([]);
    expect(result.unmapped.map((keyword) => keyword.term)).toContain('experiencia');
    expect(result.unmapped.map((keyword) => keyword.term)).not.toContain('de');
  });

  it('reconoce símbolos técnicos, alias cortos y stopwords dentro de frases', () => {
    const result = service.extract('C++ C# Gobierno de TI con ML y JS');
    expect(new Set(result.keywords.map((keyword) => keyword.term))).toEqual(
      new Set(['c#', 'c++', 'gobierno de ti', 'javascript', 'machine learning']),
    );
    expect(result.unmapped).toEqual([]);
  });
});
