/** Máximo de caracteres aceptado por POST /api/v1/nlp/extract. */
export const NLP_MAX_TEXT_LENGTH = 5000;

export interface NlpKeyword {
  /** Forma canónica normalizada del diccionario. */
  term: string;
  count: number;
}

/** Contenido de data en la respuesta de POST /api/v1/nlp/extract. */
export interface NlpExtractionResponse {
  keywords: NlpKeyword[];
  unmapped: NlpKeyword[];
}
