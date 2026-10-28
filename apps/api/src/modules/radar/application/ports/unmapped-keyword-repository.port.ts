/**
 * Puerto secundario:
 * Maneja la persistencia de auditoría de palabras clave no mapeadas.
 * Cada recálculo reemplaza los términos del titulado para evitar que la frecuencia se infle infinitamente.
 */

// Token de inyección de dependencias para NestJS
export const UNMAPPED_KEYWORD_REPOSITORY_PORT = Symbol('UnmappedKeywordRepositoryPort');

export interface UnmappedKeywordRepositoryPort {
  /**
   * Sincroniza las palabras no mapeadas del titulado en la tabla palabra_clave_no_mapeada.
   */
  syncUnmappedKeywords(tituladoId: string, unmapped: Array<{ term: string; count: number }>): Promise<void>;
}