import { aggregateRadarScores, detectTerms, KeywordDictionaryMap, DictionaryTerm } from './term-detector';

describe('Term Detector', () => {
  describe('detectTerms', () => {
    it('la frase más larga prevalece sobre términos más cortos', () => {
      // Usamos este texto para verificar que la palabra "machine" contenida en "machine learning" se ignore
      const text = 'experiencia en machine learning y otras cosas';
      const dictionary: DictionaryTerm[] = [
        { canonical: 'machine learning', alias: 'machine learning', wordCount: 2 },
        { canonical: 'machine', alias: 'machine', wordCount: 1 }
      ];
      const detected = detectTerms(text, dictionary);
      expect(detected['machine learning']).toBe(1);
      expect(detected['machine']).toBeUndefined();
    });

    it('cuenta las repeticiones sin aplicar tope', () => {
      const text = 'react react react react react';
      const dictionary: DictionaryTerm[] = [
        { canonical: 'react', alias: 'react', wordCount: 1 }
      ];
      const detected = detectTerms(text, dictionary);
      expect(detected['react']).toBe(5);
    });
  });

  describe('aggregateRadarScores', () => {
    it('aplica el tope de 3 apariciones al multiplicar por el peso', () => {
      const detected = { 'react': 5 };
      const keywordMap: KeywordDictionaryMap = {
        'react': [{ area: 'software-development', weight: 2 }]
      };
      const scores = aggregateRadarScores(detected, keywordMap);
      expect(scores['software-development']).toBe(6);
    });

    it('suma el puntaje a múltiples áreas mapeadas para una misma keyword sin dividirlo', () => {
      const detected = { 'python': 1 };
      const keywordMap: KeywordDictionaryMap = {
        'python': [
          { area: 'data-ai', weight: 3 },
          { area: 'software-development', weight: 2 }
        ]
      };
      const scores = aggregateRadarScores(detected, keywordMap);
      expect(scores['data-ai']).toBe(3);
      expect(scores['software-development']).toBe(2);
    });
  });
});