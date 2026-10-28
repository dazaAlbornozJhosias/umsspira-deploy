import { RADAR_DICTIONARY, validateRadarDictionary } from '../scripts/seed/radar-catalog';
import { areas } from '../scripts/seed/catalogs';
import { AREA_IDS } from '../scripts/seed/demo-ids';
import { normalizePhrase } from '../src/modules/nlp/domain/policies/text-normalizer';
import { STOPWORDS } from '../src/modules/nlp/domain/policies/stopwords';

describe('Radar catalog - T2.4', () => {
  it('acepta el diccionario de referencia', () => {
    expect(() => validateRadarDictionary()).not.toThrow();
  });

  it('contiene exactamente seis áreas y al menos ocho keywords por área', () => {
    expect(Object.keys(RADAR_DICTIONARY)).toHaveLength(6);

    for (const definitions of Object.values(RADAR_DICTIONARY)) {
      expect(definitions.length).toBeGreaterThanOrEqual(8);
    }
  });

  it('rechaza un peso fuera del rango 1 a 5', () => {
    const keyword = RADAR_DICTIONARY['software-development'][0];
    const original = keyword.weight;

    try {
      keyword.weight = 6;
      expect(() => validateRadarDictionary()).toThrow(/Peso inválido/);
    } finally {
      keyword.weight = original;
    }
  });

  it('rechaza una keyword duplicada dentro de la misma área', () => {
    const definitions = RADAR_DICTIONARY['software-development'];
    const duplicate = { ...definitions[0] };

    try {
      definitions.push(duplicate);
      expect(() => validateRadarDictionary()).toThrow(/duplicada/);
    } finally {
      definitions.pop();
    }
  });

  it('rechaza un alias que coincide con otra keyword canónica', () => {
    const keyword = RADAR_DICTIONARY['software-development'][0];
    const original = keyword.aliases;

    try {
      keyword.aliases = [...(original ?? []), 'typescript'];
      expect(() => validateRadarDictionary()).toThrow(/coincide con otra keyword/);
    } finally {
      keyword.aliases = original;
    }
  });

  it('rechaza un alias con más de tres palabras', () => {
    const keyword = RADAR_DICTIONARY['software-development'][0];
    const original = keyword.aliases;

    try {
      keyword.aliases = [...(original ?? []), 'una frase demasiado larga'];
      expect(() => validateRadarDictionary()).toThrow(/Alias inválido/);
    } finally {
      keyword.aliases = original;
    }
  });
});

describe('Radar catalog - cobertura Anexo A Sprint 2', () => {
  it('contiene exactamente 66 términos canónicos y 70 asociaciones', () => {
    const allTerms = Object.values(RADAR_DICTIONARY).flatMap((definitions) =>
      definitions.map((definition) => definition.term),
    );

    expect(new Set(allTerms).size).toBe(66);
    expect(allTerms).toHaveLength(70);
  });

  it('incluye los términos obligatorios del Anexo A', () => {
    const allTerms = new Set(
      Object.values(RADAR_DICTIONARY).flatMap((definitions) =>
        definitions.map((definition) => definition.term),
      ),
    );

    const required = [
      'desarrollo de software',
      'arquitectura de software',
      'google cloud',
      'arquitectura cloud',
      'gestion de ti',
      'tech lead',
      'c++',
      'c#',
      'gobierno de ti',
      'gestion de proyectos',
      'ciencia de datos',
    ];

    for (const term of required) {
      expect(allTerms.has(term)).toBe(true);
    }
  });

  it('guarda términos y alias ya normalizados', () => {
    for (const definitions of Object.values(RADAR_DICTIONARY)) {
      for (const definition of definitions) {
        expect(normalizePhrase(definition.term)).toBe(definition.term);

        for (const alias of definition.aliases ?? []) {
          expect(normalizePhrase(alias)).toBe(alias);
        }
      }
    }
  });

  it('ningún término ni alias de una palabra es stopword', () => {
    for (const definitions of Object.values(RADAR_DICTIONARY)) {
      for (const definition of definitions) {
        const keys = [definition.term, ...(definition.aliases ?? [])];

        for (const key of keys) {
          if (!key.includes(' ')) {
            expect(STOPWORDS.has(key)).toBe(false);
          }
        }
      }
    }
  });
});

describe('Catálogo de áreas - copia del equipo N28', () => {
  const byId = new Map(areas.map((area) => [area.id, area]));

  it('usa nombres cortos de la copia y mantiene las seis áreas del Radar sin padre', () => {
    for (const [id, nombre] of [
      [AREA_IDS.software, 'Desarrollo de software'],
      [AREA_IDS.cloudDevops, 'Cloud/DevOps'],
      [AREA_IDS.dataAi, 'Ciencia de Datos/IA'],
      [AREA_IDS.qualityAssurance, 'QA'],
      [AREA_IDS.cybersecurityNetworks, 'Ciberseguridad'],
      [AREA_IDS.itManagement, 'Gestión TI'],
    ]) {
      expect(byId.get(id)).toMatchObject({ nombre, padre_id: null });
    }
  });

  it('conserva las dos subáreas generales y las dos raíces', () => {
    expect(areas).toHaveLength(10);
    expect(byId.get(AREA_IDS.technology)).toMatchObject({ nombre: 'Tecnología', padre_id: null });
    expect(byId.get(AREA_IDS.management)).toMatchObject({ nombre: 'Gestión', padre_id: null });
    expect(byId.get(AREA_IDS.data)).toMatchObject({ nombre: 'Análisis de datos', padre_id: AREA_IDS.technology });
    expect(byId.get(AREA_IDS.projects)).toMatchObject({ nombre: 'Gestión de proyectos', padre_id: AREA_IDS.management });
  });
});
