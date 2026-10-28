import { Inject, Injectable, Logger } from '@nestjs/common';
import { NlpDictionaryUnavailableError } from '../../domain/errors/nlp-dictionary-unavailable-error';
import type {
  DictionaryAreaAssociation,
  DictionaryEntry,
} from '../../domain/entities/dictionary-entry';
import type { ExtractedKeyword } from '../../domain/entities/extracted-keyword';
import {
  KEYWORD_DICTIONARY_PORT,
  type KeywordDictionaryPort,
} from '../ports/keyword-dictionary.port';
import { KeywordExtractorService } from './keyword-extractor.service';
import { mapKeywordsToAreas, type KeywordAreaWeight } from './keyword-area-mapper';

const MAX_LOGGED_IGNORED_KEYS = 10;

export interface KeywordWithAreas extends ExtractedKeyword {
  areas: DictionaryAreaAssociation[];
}

/**
 * Carga el diccionario en la primera petición y reintenta en la siguiente si falla.
 * Una carga concurrente comparte la misma promesa. El calentamiento no es bloqueante.
 */
@Injectable()
export class KeywordDictionaryLoader {
  private readonly logger = new Logger(KeywordDictionaryLoader.name);
  private loaded = false;
  private loading: Promise<void> | null = null;

  /** Relaciona cada término canónico y alias con sus áreas profesionales. */
  private areasByKeyword = new Map<string, DictionaryAreaAssociation[]>();

  constructor(
    @Inject(KEYWORD_DICTIONARY_PORT)
    private readonly source: KeywordDictionaryPort,
    private readonly extractor: KeywordExtractorService,
  ) {}

  async ensureLoaded(): Promise<void> {
    if (this.loaded) {
      return;
    }

    this.loading ??= this.reload();

    try {
      await this.loading;
    } finally {
      this.loading = null;
    }
  }

  /** Intento de precarga al arrancar. Nunca interrumpe el arranque de la API. */
  async warmUp(): Promise<void> {
    try {
      await this.ensureLoaded();
    } catch {
      this.logger.warn(
        'No se pudo precargar el diccionario NLP; se reintentará en la primera petición',
      );
    }
  }

  /**
   * Devuelve las áreas asociadas a una keyword.
   * Debe llamarse después de ensureLoaded().
   */
  getAreasForKeyword(term: string): DictionaryAreaAssociation[] {
    return (this.areasByKeyword.get(term) ?? []).map((area) => ({ ...area }));
  }

  /** Añade las áreas correspondientes a cada keyword extraída. */
  resolveAreasForKeywords(keywords: ExtractedKeyword[]): KeywordWithAreas[] {
    return keywords.map((keyword) => ({
      ...keyword,
      areas: this.getAreasForKeyword(keyword.term),
    }));
  }

  /**
   * Convierte las keywords extraídas al formato esperado por el cálculo del radar.
   * Garantiza que el diccionario esté cargado antes de resolver las asociaciones.
   */
  async mapKeywordsToRadarAreas(keywords: ExtractedKeyword[]): Promise<KeywordAreaWeight[]> {
    await this.ensureLoaded();
    return mapKeywordsToAreas(keywords, this.areasByKeyword);
  }

  private async reload(): Promise<void> {
    let entries: DictionaryEntry[];

    try {
      entries = await this.source.load();
    } catch (error) {
      const name = error instanceof Error ? error.name : 'ErrorDesconocido';
      this.logger.warn(`No se pudo cargar el diccionario NLP (${name})`);
      throw this.unavailable();
    }

    if (entries.length === 0) {
      throw this.unavailable();
    }

    const report = this.extractor.loadDictionary(entries);

    if (report.loaded === 0) {
      throw this.unavailable();
    }

    const newAreasByKeyword = new Map<string, DictionaryAreaAssociation[]>();

    for (const entry of entries) {
      const areas = (entry.areas ?? []).map((area) => ({ ...area }));

      newAreasByKeyword.set(entry.canonical, areas);

      for (const alias of entry.aliases) {
        newAreasByKeyword.set(alias, areas);
      }
    }

    this.areasByKeyword = newAreasByKeyword;
    this.loaded = true;

    if (report.ignored.length > 0) {
      const detail = report.ignored
        .slice(0, MAX_LOGGED_IGNORED_KEYS)
        .map(({ key, reason }) => `${key || '<vacío>'}:${reason}`)
        .join(', ');
      const suffix = report.ignored.length > MAX_LOGGED_IGNORED_KEYS ? ', ...' : '';

      this.logger.warn(
        `Diccionario NLP: ${report.ignored.length} claves ignoradas (${detail}${suffix})`,
      );
    }
  }

  private unavailable(): NlpDictionaryUnavailableError {
    return new NlpDictionaryUnavailableError();
  }
}
