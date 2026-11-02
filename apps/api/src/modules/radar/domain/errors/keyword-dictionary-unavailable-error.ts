import { AppError } from '../../../../shared/errors/app-error';

export const KEYWORD_DICTIONARY_UNAVAILABLE = 'NLP_DICTIONARY_UNAVAILABLE';

/**
 * El radar necesita el diccionario NLP para calcular. Si no está disponible
 * no debe persistir nada y la API responde 503.
 */
export class KeywordDictionaryUnavailableError extends AppError {
  constructor() {
    super(
      KEYWORD_DICTIONARY_UNAVAILABLE,
      'El diccionario de palabras clave no está disponible temporalmente',
    );
  }
}
