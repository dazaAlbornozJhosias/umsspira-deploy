import type { DictionaryEntry } from '../../domain/entities/dictionary-entry';
import type { ExtractedKeyword, ExtractionResult } from '../../domain/entities/extracted-keyword';
import { STOPWORDS } from '../../domain/policies/stopwords';
import {
  normalizePhrase,
  normalizeText,
  splitSegments,
} from '../../domain/policies/text-normalizer';

export const MAX_NGRAM = 3;
export const MAX_UNMAPPED = 50;
export const MIN_UNMAPPED_LENGTH = 3;

const NUMERIC_TOKEN = /^[\d._+#]+$/;
const WHITESPACE_CHARACTER = /\s/;
const CLARIFICATION_BOUNDARY = Symbol('clarification-boundary');

type SequenceToken = string | typeof CLARIFICATION_BOUNDARY;

interface KeywordMatch {
  canonical: string;
  length: number;
}

export type IgnoredDictionaryKeyReason =
  'vacio' | 'sin-normalizar' | 'mas-de-3-palabras' | 'conflicto';

export interface IgnoredDictionaryKey {
  key: string;
  reason: IgnoredDictionaryKeyReason;
}

export interface DictionaryLoadReport {
  loaded: number;
  ignored: IgnoredDictionaryKey[];
}

export class KeywordExtractorService {
  private dictionary = new Map<string, string>();
  private maxWords = 0;

  loadDictionary(entries: DictionaryEntry[]): DictionaryLoadReport {
    this.dictionary = new Map<string, string>();
    this.maxWords = 0;

    const ignored: IgnoredDictionaryKey[] = [];
    for (const entry of entries) {
      this.registerKey(entry.canonical, entry.canonical, ignored);
      for (const alias of entry.aliases) {
        this.registerKey(alias, entry.canonical, ignored);
      }
    }

    return { loaded: this.dictionary.size, ignored };
  }

  extract(text: string): ExtractionResult {
    const keywordCounts = new Map<string, number>();
    const unmappedCounts = new Map<string, number>();

    for (const segment of splitSegments(text)) {
      const sequence = buildSequence(segment);
      let index = 0;

      while (index < sequence.length) {
        const token = sequence[index];
        if (token === CLARIFICATION_BOUNDARY) {
          index += 1;
          continue;
        }

        // Recorrido voraz: en cada posición gana la frase más larga que empieza ahí.
        const match = this.findMatch(sequence, index);
        if (match === null) {
          if (token !== undefined && isValidUnmappedToken(token)) {
            unmappedCounts.set(token, (unmappedCounts.get(token) ?? 0) + 1);
          }
          index += 1;
          continue;
        }

        keywordCounts.set(match.canonical, (keywordCounts.get(match.canonical) ?? 0) + 1);
        index += match.length;

        // La aclaración adyacente de la misma canónica se consume sin contarla.
        while (sequence[index] === CLARIFICATION_BOUNDARY) {
          const clarification = this.findMatch(sequence, index + 1);
          if (clarification === null || clarification.canonical !== match.canonical) {
            break;
          }
          index += 1 + clarification.length;
        }
      }
    }

    return {
      keywords: sortKeywords(keywordCounts),
      unmapped: sortKeywords(unmappedCounts).slice(0, MAX_UNMAPPED),
    };
  }

  private findMatch(sequence: readonly SequenceToken[], start: number): KeywordMatch | null {
    let available = 0;
    while (
      start + available < sequence.length &&
      sequence[start + available] !== CLARIFICATION_BOUNDARY
    ) {
      available += 1;
    }

    const maxLength = Math.min(MAX_NGRAM, this.maxWords, available);
    for (let length = maxLength; length >= 1; length -= 1) {
      const phrase = sequence.slice(start, start + length).join(' ');
      const canonical = this.dictionary.get(phrase);
      if (canonical !== undefined) {
        return { canonical, length };
      }
    }
    return null;
  }

  private registerKey(key: string, canonical: string, ignored: IgnoredDictionaryKey[]): void {
    if (key.trim().length === 0) {
      ignored.push({ key, reason: 'vacio' });
      return;
    }

    if (normalizePhrase(key) !== key) {
      ignored.push({ key, reason: 'sin-normalizar' });
      return;
    }

    const words = key.split(' ').length;
    if (words > MAX_NGRAM) {
      ignored.push({ key, reason: 'mas-de-3-palabras' });
      return;
    }

    const existing = this.dictionary.get(key);
    if (existing !== undefined) {
      if (existing !== canonical) {
        ignored.push({ key, reason: 'conflicto' });
      }
      return;
    }

    this.dictionary.set(key, canonical);
    if (words > this.maxWords) {
      this.maxWords = words;
    }
  }
}

function buildSequence(segment: string): SequenceToken[] {
  const sequence: SequenceToken[] = [];
  let hasPreviousChunk = false;

  for (const chunk of splitClarificationChunks(segment)) {
    const tokens = normalizeText(chunk);
    if (tokens.length === 0) {
      continue;
    }
    if (hasPreviousChunk) {
      sequence.push(CLARIFICATION_BOUNDARY);
    }
    sequence.push(...tokens);
    hasPreviousChunk = true;
  }

  return sequence;
}

function splitClarificationChunks(segment: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  for (let index = 0; index < segment.length; index += 1) {
    const character = segment[index];
    if (character === '(' || (character === '/' && isSpacedSlash(segment, index))) {
      chunks.push(segment.slice(start, index));
      start = index + 1;
    }
  }

  chunks.push(segment.slice(start));
  return chunks;
}

function isSpacedSlash(text: string, index: number): boolean {
  const before = text[index - 1];
  const after = text[index + 1];
  return (
    before !== undefined &&
    after !== undefined &&
    WHITESPACE_CHARACTER.test(before) &&
    WHITESPACE_CHARACTER.test(after)
  );
}

function isValidUnmappedToken(token: string): boolean {
  return token.length >= MIN_UNMAPPED_LENGTH && !STOPWORDS.has(token) && !NUMERIC_TOKEN.test(token);
}

function sortKeywords(counts: Map<string, number>): ExtractedKeyword[] {
  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }
      if (left.term < right.term) {
        return -1;
      }
      if (left.term > right.term) {
        return 1;
      }
      return 0;
    });
}
