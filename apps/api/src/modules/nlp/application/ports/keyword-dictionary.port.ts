import type { DictionaryEntry } from '../../domain/entities/dictionary-entry';

export const KEYWORD_DICTIONARY_PORT = Symbol('KEYWORD_DICTIONARY_PORT');

export interface KeywordDictionaryPort {
  load(): Promise<DictionaryEntry[]>;
}
