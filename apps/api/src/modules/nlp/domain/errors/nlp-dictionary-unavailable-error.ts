export const NLP_DICTIONARY_UNAVAILABLE = 'NLP_DICTIONARY_UNAVAILABLE';

/** Fallo propio de NLP: su traducción HTTP pertenece al filtro del módulo. */
export class NlpDictionaryUnavailableError extends Error {
  readonly code = NLP_DICTIONARY_UNAVAILABLE;

  constructor() {
    super('El diccionario de palabras clave no está disponible temporalmente');
    this.name = 'NlpDictionaryUnavailableError';
  }
}
