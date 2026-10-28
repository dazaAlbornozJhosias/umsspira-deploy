import { Logger } from '@nestjs/common';
import type { DictionaryEntry } from '../../domain/entities/dictionary-entry';
import type { KeywordDictionaryPort } from '../ports/keyword-dictionary.port';
import { KeywordDictionaryLoader } from './keyword-dictionary-loader';
import {
  NlpDictionaryUnavailableError,
  NLP_DICTIONARY_UNAVAILABLE,
} from '../../domain/errors/nlp-dictionary-unavailable-error';
import { KeywordExtractorService } from './keyword-extractor.service';
import { RADAR_AREA_IDS } from '@umsspira/shared-types';

const ENTRIES: DictionaryEntry[] = [
  {
    canonical: 'node.js',
    aliases: ['nodejs'],
    areas: [{ id: 'area-1', nombre: 'Desarrollo de Software', peso: 5 }],
  },
  {
    canonical: 'javascript',
    aliases: ['js'],
    areas: [
      { id: 'area-1', nombre: 'Desarrollo de Software', peso: 4 },
      { id: 'area-2', nombre: 'Inteligencia Artificial', peso: 2 },
    ],
  },
  {
    canonical: 'machine learning',
    aliases: ['ml'],
    areas: [{ id: 'area-2', nombre: 'Inteligencia Artificial', peso: 5 }],
  },
  { canonical: 'gobierno de ti', aliases: [], areas: [] },
];

const RADAR_ENTRIES: DictionaryEntry[] = [
  {
    canonical: 'javascript',
    aliases: ['js'],
    areas: [
      {
        id: RADAR_AREA_IDS['software-development'],
        nombre: 'Desarrollo de Software',
        peso: 4,
      },
      { id: RADAR_AREA_IDS['data-ai'], nombre: 'Datos e IA', peso: 2 },
    ],
  },
  { canonical: 'gobierno de ti', aliases: [], areas: [] },
];

class FakeDictionarySource implements KeywordDictionaryPort {
  calls = 0;
  fail = false;

  constructor(public entries: DictionaryEntry[] = ENTRIES) {}

  async load(): Promise<DictionaryEntry[]> {
    this.calls += 1;

    if (this.fail) {
      throw new Error('base de datos no disponible');
    }

    return this.entries;
  }
}

function createLoader(source: FakeDictionarySource) {
  return new KeywordDictionaryLoader(source, new KeywordExtractorService());
}

describe('KeywordDictionaryLoader', () => {
  it('carga una sola vez y conserva el diccionario en memoria', async () => {
    const source = new FakeDictionarySource();
    const loader = createLoader(source);

    await loader.ensureLoaded();
    await loader.ensureLoaded();

    expect(source.calls).toBe(1);
  });

  it('comparte una única carga entre peticiones concurrentes', async () => {
    const source = new FakeDictionarySource();
    const loader = createLoader(source);

    await Promise.all(Array.from({ length: 5 }, () => loader.ensureLoaded()));

    expect(source.calls).toBe(1);
  });

  it('falla con 503 y reintenta en la siguiente petición', async () => {
    const source = new FakeDictionarySource();
    source.fail = true;
    const loader = createLoader(source);

    await expect(loader.ensureLoaded()).rejects.toMatchObject({
      code: NLP_DICTIONARY_UNAVAILABLE,
      name: 'NlpDictionaryUnavailableError',
    });
    expect(source.calls).toBe(1);

    source.fail = false;
    await expect(loader.ensureLoaded()).resolves.toBeUndefined();
    expect(source.calls).toBe(2);
  });

  it('rechaza un diccionario vacío y permite reintentar', async () => {
    const source = new FakeDictionarySource([]);
    const loader = createLoader(source);

    await expect(loader.ensureLoaded()).rejects.toMatchObject({
      code: NLP_DICTIONARY_UNAVAILABLE,
    });

    source.entries = ENTRIES;
    await expect(loader.ensureLoaded()).resolves.toBeUndefined();
    expect(source.calls).toBe(2);
  });

  it('rechaza un diccionario cuyas claves son todas inválidas', async () => {
    const source = new FakeDictionarySource([{ canonical: 'Node.JS', aliases: [] }]);
    const loader = createLoader(source);

    await expect(loader.ensureLoaded()).rejects.toMatchObject({
      code: NLP_DICTIONARY_UNAVAILABLE,
    });
  });

  it('el calentamiento no propaga errores', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const source = new FakeDictionarySource();
    source.fail = true;
    const loader = createLoader(source);

    try {
      await expect(loader.warmUp()).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('se reintentará'));
    } finally {
      warn.mockRestore();
    }
  });

  it('advierte las claves ignoradas sin volcar el diccionario completo', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const source = new FakeDictionarySource([
      { canonical: 'node.js', aliases: [] },
      { canonical: 'Node.JS', aliases: [] },
      { canonical: 'una frase con demasiadas palabras', aliases: [] },
    ]);
    const loader = createLoader(source);

    try {
      await loader.ensureLoaded();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('2 claves ignoradas'));
    } finally {
      warn.mockRestore();
    }
  });

  it('obtiene las áreas y los pesos de una keyword canónica', async () => {
    const loader = createLoader(new FakeDictionarySource());

    await loader.ensureLoaded();

    expect(loader.getAreasForKeyword('node.js')).toEqual([
      { id: 'area-1', nombre: 'Desarrollo de Software', peso: 5 },
    ]);
  });

  it('encuentra las áreas utilizando un alias', async () => {
    const loader = createLoader(new FakeDictionarySource());

    await loader.ensureLoaded();

    expect(loader.getAreasForKeyword('js')).toEqual([
      { id: 'area-1', nombre: 'Desarrollo de Software', peso: 4 },
      { id: 'area-2', nombre: 'Inteligencia Artificial', peso: 2 },
    ]);
  });

  it('devuelve una lista vacía cuando la keyword no tiene áreas', async () => {
    const loader = createLoader(new FakeDictionarySource());

    await loader.ensureLoaded();

    expect(loader.getAreasForKeyword('gobierno de ti')).toEqual([]);
    expect(loader.getAreasForKeyword('keyword-inexistente')).toEqual([]);
  });

  it('resuelve las áreas sin perder el término ni su cantidad', async () => {
    const loader = createLoader(new FakeDictionarySource());

    await loader.ensureLoaded();

    expect(
      loader.resolveAreasForKeywords([
        { term: 'node.js', count: 2 },
        { term: 'javascript', count: 3 },
      ]),
    ).toEqual([
      {
        term: 'node.js',
        count: 2,
        areas: [{ id: 'area-1', nombre: 'Desarrollo de Software', peso: 5 }],
      },
      {
        term: 'javascript',
        count: 3,
        areas: [
          { id: 'area-1', nombre: 'Desarrollo de Software', peso: 4 },
          { id: 'area-2', nombre: 'Inteligencia Artificial', peso: 2 },
        ],
      },
    ]);
  });

  it('mapea keywords a las áreas del radar de extremo a extremo (HU6-C9)', async () => {
    const source = new FakeDictionarySource(RADAR_ENTRIES);
    const loader = createLoader(source);

    const keywords = [
      { term: 'javascript', count: 3 },
      { term: 'js', count: 1 },
      { term: 'gobierno de ti', count: 1 },
    ];

    const first = await loader.mapKeywordsToRadarAreas(keywords);
    const second = await loader.mapKeywordsToRadarAreas(keywords);

    expect(source.calls).toBe(1);
    expect(first).toEqual([
      { term: 'javascript', area: 'software-development', weight: 4 },
      { term: 'javascript', area: 'data-ai', weight: 2 },
      { term: 'js', area: 'software-development', weight: 4 },
      { term: 'js', area: 'data-ai', weight: 2 },
    ]);
    expect(second).toEqual(first);

    await expect(
      loader.mapKeywordsToRadarAreas([{ term: 'gobierno de ti', count: 1 }]),
    ).resolves.toEqual([]);
    expect(source.calls).toBe(1);

    const failingSource = new FakeDictionarySource(RADAR_ENTRIES);
    failingSource.fail = true;
    const failingLoader = createLoader(failingSource);

    await expect(
      failingLoader.mapKeywordsToRadarAreas([{ term: 'javascript', count: 1 }]),
    ).rejects.toBeInstanceOf(NlpDictionaryUnavailableError);
    expect(failingSource.calls).toBe(1);

    failingSource.fail = false;

    await expect(
      failingLoader.mapKeywordsToRadarAreas([{ term: 'javascript', count: 1 }]),
    ).resolves.toEqual([
      { term: 'javascript', area: 'software-development', weight: 4 },
      { term: 'javascript', area: 'data-ai', weight: 2 },
    ]);
    expect(failingSource.calls).toBe(2);
  });
});
