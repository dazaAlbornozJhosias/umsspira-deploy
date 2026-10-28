import { STOPWORDS, STOPWORDS_COMPARTIDAS, STOPWORDS_EN, STOPWORDS_ES } from './stopwords';
import { normalizePhrase, normalizeText, splitSegments } from './text-normalizer';

const CASES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['Node.JS', ['node.js']],
  ['C++, C# y Node.js.', ['c++', 'c#', 'y', 'node.js']],
  ['CI/CD', ['ci', 'cd']],
  ['Programación', ['programacion']],
  ['Año Ñandú', ['ano', 'nandu']],
  ['ÁÉÍÓÚ ÜÑ', ['aeiou', 'un']],
  ['', []],
  ['   ', []],
  ['Power BI', ['power', 'bi']],
  ['(C++)', ['c++']],
  ['c#.', ['c#']],
  ['...hola', ['hola']],
  ['#hashtag', ['hashtag']],
  ['e-mail', ['e', 'mail']],
  ['Versión 3.5 y 2.0.1', ['version', '3.5', 'y', '2.0.1']],
  ['machine_learning', ['machine_learning']],
  ['PostgreSQL.', ['postgresql']],
  ['¿Qué es Node.js?', ['que', 'es', 'node.js']],
  ['JavaScript/TypeScript', ['javascript', 'typescript']],
  ['C++/C#', ['c++', 'c#']],
  ['tab\tsep', ['tab', 'sep']],
];

const PALABRAS_CLAVE = [
  ['TypeScript', 'typescript'],
  ['Excel', 'excel'],
  ['Machine Learning', 'machine learning'],
  ['Power BI', 'power bi'],
  ['React', 'react'],
  ['Node.js', 'node.js'],
  ['JavaScript', 'javascript'],
  ['Docker', 'docker'],
  ['Python', 'python'],
  ['PostgreSQL', 'postgresql'],
  ['SQL', 'sql'],
  ['Git', 'git'],
];

const ALIAS = [
  ['TS', 'ts'],
  ['PowerBI', 'powerbi'],
  ['JS', 'js'],
  ['Postgres', 'postgres'],
  ['ReactJS', 'reactjs'],
  ['NodeJS', 'nodejs'],
  ['ML', 'ml'],
];

const PERFIL = `Soy desarrollador de software con experiencia en
    JavaScript, React, Node.js, Python y PostgreSQL.
    Utilizo Docker para desplegar aplicaciones,
    Git para control de versiones y SQL para
    gestionar bases de datos.
    También tengo conocimientos en Machine Learning.`;

function containsSequence(tokens: readonly string[], sequence: readonly string[]): boolean {
  return tokens.some((_, index) =>
    sequence.every((expected, offset) => tokens[index + offset] === expected),
  );
}

describe('normalizeText', () => {
  it.each(CASES)('normaliza %p', (input, expected) => {
    expect(normalizeText(input)).toEqual(expected);
  });

  it('es idempotente sobre la forma normalizada de una frase', () => {
    for (const [input] of CASES) {
      expect(normalizeText(normalizePhrase(input))).toEqual(normalizeText(input));
    }
  });

  it('es determinista para la misma entrada', () => {
    for (const [input] of CASES) {
      expect(normalizeText(input)).toEqual(normalizeText(input));
    }
  });

  it('trata \\r\\n, \\n y las tabulaciones como separadores', () => {
    expect(normalizeText('a\r\nb\tc')).toEqual(['a', 'b', 'c']);
  });

  it('mantiene su salida destructiva con barras, guiones y paréntesis', () => {
    expect(normalizeText('JS / JavaScript')).toEqual(['js', 'javascript']);
    expect(normalizeText('JS/JavaScript')).toEqual(['js', 'javascript']);
    expect(normalizeText('JS - JavaScript')).toEqual(['js', 'javascript']);
    expect(normalizeText('JavaScript (JS)')).toEqual(['javascript', 'js']);
    expect(normalizePhrase('Node.js / JavaScript')).toBe('node.js javascript');
  });

  it('normaliza 5000 caracteres en menos de 200 ms', () => {
    const sample = 'Programación Node.js, CI/CD y machine_learning. '.repeat(150).slice(0, 5000);
    normalizeText(sample);
    const start = performance.now();
    const tokens = normalizeText(sample);
    const elapsed = performance.now() - start;
    expect(tokens.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(200);
  });
});

describe('splitSegments', () => {
  it('recorta espacios y descarta segmentos vacíos', () => {
    expect(splitSegments('a\n\n b ')).toEqual(['a', 'b']);
    expect(splitSegments('a\r\nb')).toEqual(['a', 'b']);
    expect(splitSegments('')).toEqual([]);
    expect(splitSegments('\n\n')).toEqual([]);
  });

  it('divide antes de normalizar para conservar el límite entre frases', () => {
    // La división debe ocurrir antes de normalizeText: así "machine" y
    // "learning" quedan en segmentos distintos y el extractor puede decidir
    // si los une como frase del diccionario.
    expect(splitSegments('machine\nlearning')).toEqual(['machine', 'learning']);
    expect(splitSegments('machine\nlearning').flatMap(normalizeText)).toEqual([
      'machine',
      'learning',
    ]);
    expect(normalizeText('machine\nlearning')).toEqual(['machine', 'learning']);
  });
});

describe('STOPWORDS', () => {
  it('contiene al menos 100 entradas', () => {
    expect(STOPWORDS.size).toBeGreaterThanOrEqual(100);
  });

  it('ya está normalizada y cada entrada es un único token', () => {
    for (const stopword of STOPWORDS) {
      expect(normalizePhrase(stopword)).toBe(stopword);
      expect(stopword).not.toContain(' ');
    }
  });

  it('incluye stopwords comunes de español e inglés', () => {
    for (const word of ['de', 'para', 'con', 'en', 'y', 'the', 'and', 'tambien']) {
      expect(STOPWORDS.has(word)).toBe(true);
    }
  });

  it('no incluye términos de dominio ni candidatos no mapeados', () => {
    const forbidden = [
      'software',
      'experiencia',
      'desarrollador',
      'datos',
      'desarrollo',
      'proyectos',
      'gestion',
      'sistemas',
      'aplicaciones',
      'conocimientos',
    ];
    for (const word of forbidden) {
      expect(STOPWORDS.has(word)).toBe(false);
    }
  });

  it('no incluye palabras ni alias del diccionario', () => {
    for (const [, normalized] of [...PALABRAS_CLAVE, ...ALIAS]) {
      expect(STOPWORDS.has(normalized)).toBe(false);
    }
    expect(STOPWORDS.has('js')).toBe(false);
    expect(STOPWORDS.has('ts')).toBe(false);
    expect(STOPWORDS.has('ml')).toBe(false);
  });

  it('no tiene duplicados internos en los arreglos por idioma', () => {
    for (const words of [STOPWORDS_ES, STOPWORDS_EN, STOPWORDS_COMPARTIDAS]) {
      expect(new Set(words).size).toBe(words.length);
    }
  });

  it('mantiene los arreglos por idioma disjuntos entre sí', () => {
    const es = new Set(STOPWORDS_ES);
    const en = new Set(STOPWORDS_EN);
    for (const word of STOPWORDS_EN) {
      expect(es.has(word)).toBe(false);
    }
    for (const word of STOPWORDS_COMPARTIDAS) {
      expect(es.has(word)).toBe(false);
      expect(en.has(word)).toBe(false);
    }
  });

  it('construye STOPWORDS con la suma de los tres arreglos', () => {
    expect(STOPWORDS.size).toBe(
      STOPWORDS_ES.length + STOPWORDS_EN.length + STOPWORDS_COMPARTIDAS.length,
    );
  });

  it('incluye las nuevas stopwords y las compartidas', () => {
    const expected = [
      'has',
      'he',
      'me',
      'no',
      'ademas',
      'aunque',
      'dentro',
      'fuera',
      'mediante',
      'mientras',
      'sido',
      'tenemos',
      'tuve',
      'fui',
      'estuve',
      'also',
      'could',
      'may',
      'might',
      'must',
      'within',
      'without',
    ];
    for (const word of expected) {
      expect(STOPWORDS.has(word)).toBe(true);
    }
  });

  it('no filtra las letras c ni r, usadas como lenguajes', () => {
    expect(STOPWORDS.has('c')).toBe(false);
    expect(STOPWORDS.has('r')).toBe(false);
  });
});

describe('alineación con los datos de la base de datos', () => {
  it('normaliza las palabras clave como termino_normalizado', () => {
    for (const [name, normalized] of PALABRAS_CLAVE) {
      expect(normalizePhrase(name)).toBe(normalized);
    }
  });

  it('normaliza los alias como alias_normalizado', () => {
    for (const [name, normalized] of ALIAS) {
      expect(normalizePhrase(name)).toBe(normalized);
    }
  });

  it('une las variantes de escritura de un mismo término', () => {
    expect(normalizeText('Node.JS')).toEqual(normalizeText('NODE.JS'));
    expect(normalizeText('NODE.JS')).toEqual(normalizeText('node.js'));
    expect(normalizePhrase('NodeJS')).toBe('nodejs');
  });

  it('conserva los términos del diccionario en el texto real de un perfil', () => {
    const segments = splitSegments(PERFIL);
    expect(segments).toHaveLength(6);

    const tokens = segments.flatMap(normalizeText);
    for (const term of [
      'javascript',
      'react',
      'node.js',
      'python',
      'postgresql',
      'docker',
      'git',
      'sql',
    ]) {
      expect(tokens).toContain(term);
    }
    expect(containsSequence(tokens, ['machine', 'learning'])).toBe(true);
  });
});
