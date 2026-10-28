import type { DictionaryEntry } from '../../domain/entities/dictionary-entry';
import type { ExtractedKeyword } from '../../domain/entities/extracted-keyword';
import { STOPWORDS } from '../../domain/policies/stopwords';
import { KeywordExtractorService } from './keyword-extractor.service';

const ENTRADAS: DictionaryEntry[] = [
  { canonical: 'typescript', aliases: ['ts'] },
  { canonical: 'excel', aliases: [] },
  { canonical: 'machine learning', aliases: ['ml'] },
  { canonical: 'power bi', aliases: ['powerbi'] },
  { canonical: 'react', aliases: ['reactjs'] },
  { canonical: 'node.js', aliases: ['nodejs'] },
  { canonical: 'javascript', aliases: ['js'] },
  { canonical: 'docker', aliases: [] },
  { canonical: 'python', aliases: [] },
  { canonical: 'postgresql', aliases: ['postgres'] },
  { canonical: 'sql', aliases: [] },
  { canonical: 'git', aliases: [] },
  { canonical: 'gobierno de ti', aliases: [] },
  { canonical: 'ciencia de datos', aliases: [] },
  { canonical: 'analisis de datos', aliases: [] },
  { canonical: 'gestion de proyectos', aliases: [] },
  { canonical: 'liderazgo de equipos', aliases: [] },
  { canonical: 'c++', aliases: [] },
  { canonical: 'c#', aliases: [] },
  { canonical: 'ci cd', aliases: ['cicd'] },
  { canonical: 'inteligencia artificial', aliases: ['ia'] },
  {
    canonical: 'qa',
    aliases: ['quality assurance', 'aseguramiento de calidad'],
  },
  { canonical: 'amazon web services', aliases: ['aws'] },
  { canonical: 'kubernetes', aliases: [] },
  { canonical: 'pandas', aliases: [] },
];

const PERFIL = `Soy desarrollador de software con experiencia en
    JavaScript, React, Node.js, Python y PostgreSQL.
    Utilizo Docker para desplegar aplicaciones,
    Git para control de versiones y SQL para
    gestionar bases de datos.
    También tengo conocimientos en Machine Learning.`;

function terms(keywords: ExtractedKeyword[]): string[] {
  return keywords.map((keyword) => keyword.term);
}

describe('KeywordExtractorService', () => {
  let service: KeywordExtractorService;

  beforeEach(() => {
    service = new KeywordExtractorService();
    service.loadDictionary(ENTRADAS);
  });

  describe('formato y orden', () => {
    it('devuelve keywords y unmapped con term y count (CA1)', () => {
      expect(service.extract('React y observabilidad observabilidad')).toEqual({
        keywords: [{ term: 'react', count: 1 }],
        unmapped: [{ term: 'observabilidad', count: 2 }],
      });
    });

    it('ordena keywords por count descendente y luego alfabéticamente', () => {
      const custom = new KeywordExtractorService();
      custom.loadDictionary([
        { canonical: 'alfa', aliases: [] },
        { canonical: 'beta', aliases: [] },
        { canonical: 'gamma', aliases: [] },
      ]);

      expect(custom.extract('beta alfa beta gamma gamma').keywords).toEqual([
        { term: 'beta', count: 2 },
        { term: 'gamma', count: 2 },
        { term: 'alfa', count: 1 },
      ]);
    });

    it('ordena unmapped por count descendente y luego alfabéticamente', () => {
      const result = new KeywordExtractorService().extract('beta alfa beta gamma gamma delta');

      expect(result.keywords).toEqual([]);
      expect(result.unmapped).toEqual([
        { term: 'beta', count: 2 },
        { term: 'gamma', count: 2 },
        { term: 'alfa', count: 1 },
        { term: 'delta', count: 1 },
      ]);
    });

    it('devuelve listas vacías con texto vacío o solo espacios', () => {
      for (const text of ['', '   ', '\n\n']) {
        expect(service.extract(text)).toEqual({ keywords: [], unmapped: [] });
      }
    });

    it('nunca lanza con símbolos, emojis ni textos largos', () => {
      for (const text of ['!!!', '😀😀', '+++ ### ___', 'a '.repeat(5000)]) {
        expect(() => service.extract(text)).not.toThrow();
      }
    });
  });

  describe('variantes y símbolos', () => {
    it('resuelve variantes de Node.js con el mismo canónico (CA2)', () => {
      expect(service.extract('Node.JS y nodejs')).toEqual({
        keywords: [{ term: 'node.js', count: 2 }],
        unmapped: [],
      });
    });

    it('resuelve alias de dos letras sin enviarlos a unmapped', () => {
      const result = service.extract('JS, TS y ML');

      expect(result.keywords).toEqual([
        { term: 'javascript', count: 1 },
        { term: 'machine learning', count: 1 },
        { term: 'typescript', count: 1 },
      ]);
      expect(result.unmapped).toEqual([]);
    });

    it('conserva C++ y C# (CA3)', () => {
      expect(service.extract('C++ y C#')).toEqual({
        keywords: [
          { term: 'c#', count: 1 },
          { term: 'c++', count: 1 },
        ],
        unmapped: [],
      });
    });

    it('resuelve ReactJS, Postgres y PowerBI a su canónico', () => {
      expect(service.extract('ReactJS Postgres PowerBI').keywords).toEqual([
        { term: 'postgresql', count: 1 },
        { term: 'power bi', count: 1 },
        { term: 'react', count: 1 },
      ]);
    });
  });

  describe('frase más larga y una sola mención', () => {
    it('cuenta Machine Learning una sola vez y no deja sus palabras sueltas', () => {
      expect(service.extract('Machine Learning')).toEqual({
        keywords: [{ term: 'machine learning', count: 1 }],
        unmapped: [],
      });
    });

    it('prefiere la frase más larga cuando compite con una palabra', () => {
      const custom = new KeywordExtractorService();
      custom.loadDictionary([
        { canonical: 'machine', aliases: [] },
        { canonical: 'machine learning', aliases: [] },
      ]);

      const result = custom.extract('machine learning');
      expect(result.keywords).toEqual([{ term: 'machine learning', count: 1 }]);
      expect(terms(result.keywords)).not.toContain('machine');
    });

    it('es voraz: con "a b" y "b c" gana "a b" en "a b c"', () => {
      const custom = new KeywordExtractorService();
      custom.loadDictionary([
        { canonical: 'a b', aliases: [] },
        { canonical: 'b c', aliases: [] },
      ]);

      const result = custom.extract('a b c');
      expect(result.keywords).toEqual([{ term: 'a b', count: 1 }]);
      expect(terms(result.keywords)).not.toContain('b c');
    });
  });

  describe('frases que contienen stopwords', () => {
    it('detecta Gobierno de TI sin dejar de ni ti en unmapped', () => {
      expect(service.extract('Gobierno de TI')).toEqual({
        keywords: [{ term: 'gobierno de ti', count: 1 }],
        unmapped: [],
      });
    });

    it('detecta frases de datos con stopwords en medio', () => {
      const result = service.extract('Ciencia de datos y análisis de datos');

      expect(result.keywords).toEqual([
        { term: 'analisis de datos', count: 1 },
        { term: 'ciencia de datos', count: 1 },
      ]);
      expect(result.unmapped).toEqual([]);
    });

    it('detecta Gestión de proyectos sin palabras sueltas', () => {
      const result = service.extract('Gestión de proyectos');

      expect(result.keywords).toEqual([{ term: 'gestion de proyectos', count: 1 }]);
      expect(terms(result.unmapped)).not.toContain('gestion');
      expect(terms(result.unmapped)).not.toContain('proyectos');
    });

    it('detecta Liderazgo de equipos', () => {
      expect(service.extract('Liderazgo de equipos').keywords).toEqual([
        { term: 'liderazgo de equipos', count: 1 },
      ]);
    });

    it('detecta una frase y descarta las stopwords que quedan fuera', () => {
      const result = service.extract('Gestión de proyectos de TI');

      expect(result.keywords).toEqual([{ term: 'gestion de proyectos', count: 1 }]);
      expect(result.unmapped).toEqual([]);
    });

    it('resuelve alias de varias palabras a QA', () => {
      for (const text of ['Aseguramiento de calidad', 'Quality Assurance']) {
        expect(service.extract(text).keywords).toEqual([{ term: 'qa', count: 1 }]);
      }
    });

    it('deja experiencia como candidata pero filtra la stopword de', () => {
      const result = service.extract('Experiencia de varios años');

      expect(terms(result.unmapped)).toContain('experiencia');
      expect(terms(result.unmapped)).not.toContain('de');
    });
  });

  describe('misma mención', () => {
    it('consolida keyword y alias unidos por paréntesis', () => {
      expect(service.extract('Amazon Web Services (AWS)').keywords).toEqual([
        { term: 'amazon web services', count: 1 },
      ]);
      expect(service.extract('AWS (Amazon Web Services)').keywords).toEqual([
        { term: 'amazon web services', count: 1 },
      ]);
      expect(service.extract('JavaScript (JS)').keywords).toEqual([
        { term: 'javascript', count: 1 },
      ]);
    });

    it('consolida keyword y alias unidos por una barra con espacios', () => {
      expect(service.extract('JS / JavaScript').keywords).toEqual([
        { term: 'javascript', count: 1 },
      ]);
    });

    it('consolida la pareja y cuenta aparte una mención suelta', () => {
      expect(service.extract('JavaScript (JS) y JS').keywords).toEqual([
        { term: 'javascript', count: 2 },
      ]);
    });

    it('no consolida menciones separadas por coma', () => {
      expect(service.extract('conozco JS, además domino JavaScript').keywords).toEqual([
        { term: 'javascript', count: 2 },
      ]);
    });

    it('no consolida menciones solo adyacentes sin delimitador', () => {
      expect(service.extract('JS JavaScript').keywords).toEqual([{ term: 'javascript', count: 2 }]);
    });

    it('no consolida con guion', () => {
      expect(service.extract('JS - JavaScript').keywords).toEqual([
        { term: 'javascript', count: 2 },
      ]);
    });

    it('no consolida con barra sin espacios', () => {
      expect(service.extract('JS/JavaScript').keywords).toEqual([{ term: 'javascript', count: 2 }]);
    });

    it('no fusiona canónicas distintas unidas por barra', () => {
      expect(service.extract('Node.js / JavaScript').keywords).toEqual([
        { term: 'javascript', count: 1 },
        { term: 'node.js', count: 1 },
      ]);
      expect(service.extract('Docker / Kubernetes').keywords).toEqual([
        { term: 'docker', count: 1 },
        { term: 'kubernetes', count: 1 },
      ]);
      expect(service.extract('Python (Pandas)').keywords).toEqual([
        { term: 'pandas', count: 1 },
        { term: 'python', count: 1 },
      ]);
    });

    it('mantiene las palabras desconocidas del paréntesis en unmapped', () => {
      expect(service.extract('React (hooks)')).toEqual({
        keywords: [{ term: 'react', count: 1 }],
        unmapped: [{ term: 'hooks', count: 1 }],
      });
    });

    it('no altera la normalización de CI/CD', () => {
      expect(service.extract('CI/CD')).toEqual({
        keywords: [{ term: 'ci cd', count: 1 }],
        unmapped: [],
      });
    });

    it('consolida una cadena de la misma canónica unida por separadores válidos', () => {
      expect(service.extract('JS / JavaScript / JS').keywords).toEqual([
        { term: 'javascript', count: 1 },
      ]);
    });

    it('no cruza el límite de campo', () => {
      expect(service.extract('Amazon Web Services\n(AWS)').keywords).toEqual([
        { term: 'amazon web services', count: 2 },
      ]);
    });
  });

  describe('límites de campo', () => {
    it('no cruza n-gramas entre segmentos (CA9)', () => {
      expect(service.extract('gobierno de\nti').keywords).toEqual([]);
    });

    it('no une machine y learning en segmentos distintos', () => {
      const result = service.extract('machine\nlearning');

      expect(result.keywords).toEqual([]);
      expect(terms(result.unmapped)).toContain('machine');
      expect(terms(result.unmapped)).toContain('learning');
    });
  });

  describe('no mapeadas', () => {
    it('devuelve candidatos desconocidos en unmapped (CA4)', () => {
      expect(service.extract('observabilidad').unmapped).toEqual([
        { term: 'observabilidad', count: 1 },
      ]);
    });

    it('descarta todas las stopwords (CA7)', () => {
      expect(service.extract('de la y para con')).toEqual({
        keywords: [],
        unmapped: [],
      });
    });

    it('filtra cortas, numéricas y stopwords', () => {
      expect(service.extract('ab abc 2024 3.5 2.0.1 de').unmapped).toEqual([
        { term: 'abc', count: 1 },
      ]);
    });

    it('recorta unmapped a 50 después de ordenar', () => {
      const words = Array.from(
        { length: 60 },
        (_, index) => `candidato${String(index).padStart(2, '0')}`,
      );
      const text = words
        .map((word, index) => Array.from({ length: 60 - index }, () => word).join(' '))
        .join(' ');

      const result = new KeywordExtractorService().extract(text);
      expect(result.unmapped).toHaveLength(50);
      expect(result.unmapped[0]).toEqual({ term: 'candidato00', count: 60 });
      expect(result.unmapped[49]).toEqual({ term: 'candidato49', count: 11 });
      expect(terms(result.unmapped)).not.toContain('candidato50');
    });
  });

  describe('perfil real', () => {
    it('detecta los términos del diccionario sin lógica por fuente (CA8)', () => {
      const result = service.extract(PERFIL);

      expect(result.keywords).toEqual([
        { term: 'docker', count: 1 },
        { term: 'git', count: 1 },
        { term: 'javascript', count: 1 },
        { term: 'machine learning', count: 1 },
        { term: 'node.js', count: 1 },
        { term: 'postgresql', count: 1 },
        { term: 'python', count: 1 },
        { term: 'react', count: 1 },
        { term: 'sql', count: 1 },
      ]);
    });

    it('conserva los candidatos no mapeados relevantes', () => {
      const unmapped = terms(service.extract(PERFIL).unmapped);

      for (const word of [
        'desarrollador',
        'software',
        'experiencia',
        'utilizo',
        'desplegar',
        'aplicaciones',
        'control',
        'versiones',
        'gestionar',
        'bases',
        'datos',
        'conocimientos',
      ]) {
        expect(unmapped).toContain(word);
      }
      for (const word of ['de', 'para', 'con', 'en', 'y', 'soy', 'tengo', 'tambien']) {
        expect(unmapped).not.toContain(word);
      }
    });
  });

  describe('loadDictionary', () => {
    it('carga la fixture sin claves ignoradas', () => {
      const report = new KeywordExtractorService().loadDictionary(ENTRADAS);

      expect(report).toEqual({ loaded: 37, ignored: [] });
    });

    it('ignora claves sin normalizar', () => {
      const report = new KeywordExtractorService().loadDictionary([
        { canonical: 'Node.JS', aliases: [] },
      ]);

      expect(report).toEqual({
        loaded: 0,
        ignored: [{ key: 'Node.JS', reason: 'sin-normalizar' }],
      });
    });

    it('ignora frases de más de tres palabras', () => {
      const report = new KeywordExtractorService().loadDictionary([
        { canonical: 'gestion de proyectos ti', aliases: [] },
      ]);

      expect(report).toEqual({
        loaded: 0,
        ignored: [{ key: 'gestion de proyectos ti', reason: 'mas-de-3-palabras' }],
      });
    });

    it('ignora claves vacías o con solo espacios', () => {
      const report = new KeywordExtractorService().loadDictionary([
        { canonical: '', aliases: [] },
        { canonical: '   ', aliases: [] },
      ]);

      expect(report).toEqual({
        loaded: 0,
        ignored: [
          { key: '', reason: 'vacio' },
          { key: '   ', reason: 'vacio' },
        ],
      });
    });

    it('marca conflictos y conserva el primer canónico', () => {
      const custom = new KeywordExtractorService();
      const report = custom.loadDictionary([
        { canonical: 'alfa', aliases: ['comun'] },
        { canonical: 'beta', aliases: ['comun'] },
      ]);

      expect(report).toEqual({
        loaded: 3,
        ignored: [{ key: 'comun', reason: 'conflicto' }],
      });
      expect(custom.extract('comun').keywords).toEqual([{ term: 'alfa', count: 1 }]);
    });

    it('reemplaza el diccionario anterior en cada carga', () => {
      const report = service.loadDictionary([{ canonical: 'react', aliases: [] }]);

      expect(report).toEqual({ loaded: 1, ignored: [] });
      expect(service.extract('react typescript').keywords).toEqual([{ term: 'react', count: 1 }]);
      expect(service.extract('react typescript').unmapped).toEqual([
        { term: 'typescript', count: 1 },
      ]);
    });

    it('funciona sin diccionario cargado o con uno vacío', () => {
      const unloaded = new KeywordExtractorService();
      expect(unloaded.extract('observabilidad')).toEqual({
        keywords: [],
        unmapped: [{ term: 'observabilidad', count: 1 }],
      });

      const empty = new KeywordExtractorService();
      expect(empty.loadDictionary([])).toEqual({ loaded: 0, ignored: [] });
      expect(empty.extract('observabilidad')).toEqual({
        keywords: [],
        unmapped: [{ term: 'observabilidad', count: 1 }],
      });
    });
  });

  describe('coherencia con stopwords', () => {
    it('ningún término o alias de una palabra está en STOPWORDS', () => {
      for (const entry of ENTRADAS) {
        for (const key of [entry.canonical, ...entry.aliases]) {
          if (!key.includes(' ')) {
            expect(STOPWORDS.has(key)).toBe(false);
          }
        }
      }
    });
  });

  describe('propiedades', () => {
    it('es determinista', () => {
      expect(service.extract(PERFIL)).toEqual(service.extract(PERFIL));
    });

    it('extract no modifica el diccionario cargado', () => {
      const first = service.extract(PERFIL);
      expect(service.extract(PERFIL)).toEqual(first);
      expect(service.extract('nodejs').keywords).toEqual([{ term: 'node.js', count: 1 }]);
    });
  });

  describe('rendimiento', () => {
    it('procesa 5000 caracteres con 2000 términos en menos de 1000 ms', () => {
      const entries: DictionaryEntry[] = Array.from({ length: 2000 }, (_, index) => ({
        canonical: `keyword${index}`,
        aliases: [`alias${index}`],
      }));
      const custom = new KeywordExtractorService();
      custom.loadDictionary(entries);

      const text = Array.from(
        { length: 1000 },
        (_, index) => `keyword${index} palabra${index} alias${index}`,
      )
        .join(' ')
        .slice(0, 5000);

      custom.extract(text);
      const start = performance.now();
      const result = custom.extract(text);
      const elapsed = performance.now() - start;

      expect(result.keywords.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(1000);
    });
  });
});
