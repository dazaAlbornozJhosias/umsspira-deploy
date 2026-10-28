/**
 * Puerto secundario:
 * Define cómo el módulo de Radar se comunica con el motor NLP (HU-1).
 * radar no sabe cómo tokeniza NLP; solo le manda textos y recibe keywords normalizadas.
 */

export interface ExtractedKeywordResult {
  // Palabras clave reconocidas que existen en el diccionario de la base de datos
  keywords: Array<{ term: string; count: number }>;
  
  // Términos candidatos que no existen en el diccionario (para auditoría)
  unmapped: Array<{ term: string; count: number }>;
}

// Token de inyección de dependencias para NestJS
export const KEYWORD_EXTRACTOR_PORT = Symbol('KeywordExtractorPort');

export interface KeywordExtractorPort {
  /**
   * Envía los segmentos de texto al servicio NLP para su análisis
   */
  extractFromTexts(texts: string[]): Promise<ExtractedKeywordResult>;
}