import type { KeywordDictionaryPort } from '../../src/modules/nlp/application/ports/keyword-dictionary.port';
import type { DictionaryEntry } from '../../src/modules/nlp/domain/entities/dictionary-entry';

export const NLP_TEST_DICTIONARY: DictionaryEntry[] = [
  { canonical: 'javascript', aliases: ['js'] },
  { canonical: 'typescript', aliases: ['ts'] },
  { canonical: 'node.js', aliases: ['nodejs'] },
  { canonical: 'react', aliases: ['reactjs'] },
  { canonical: 'c++', aliases: [] },
  { canonical: 'c#', aliases: [] },
  { canonical: 'ci cd', aliases: ['cicd'] },
  { canonical: 'machine learning', aliases: ['ml'] },
  { canonical: 'amazon web services', aliases: ['aws'] },
  { canonical: 'gobierno de ti', aliases: [] },
  { canonical: 'gestion de proyectos', aliases: [] },
  { canonical: 'ciencia de datos', aliases: [] },
  { canonical: 'analisis de datos', aliases: [] },
  { canonical: 'liderazgo de equipos', aliases: [] },
  { canonical: 'docker', aliases: [] },
  { canonical: 'postgresql', aliases: ['postgres'] },
];

export class InMemoryKeywordDictionary implements KeywordDictionaryPort {
  calls = 0;
  fail = false;

  constructor(public entries: DictionaryEntry[] = NLP_TEST_DICTIONARY) {}

  async load(): Promise<DictionaryEntry[]> {
    this.calls += 1;

    if (this.fail) {
      throw new Error('diccionario no disponible en la prueba');
    }

    return this.entries;
  }
}
