import type { RadarArea } from '@umsspira/shared-types';
// Define el tipo para los términos del diccionario
export type DictionaryTerm = {
  canonical: string;
  alias: string; // Puede tener 1, 2 o 3 palabras
  wordCount: number;
};

/**
 * Detecta términos de 1 a 3 palabras en un texto normalizado.
 * Regla: La frase más larga prevalece y no se cuenta dos veces.
 */
export const detectTerms = (normalizedText: string, dictionary: DictionaryTerm[]): Record<string, number> => {
  const detectedCounts: Record<string, number> = {};
  let workingText = normalizedText;

  // 1. Ordenar el diccionario por longitud de palabras (descendente: 3, luego 2, luego 1)
  const sortedDictionary = [...dictionary].sort((a, b) => b.wordCount - a.wordCount);

  // 2. Buscar y tachar
  for (const term of sortedDictionary) {
    // Usar regex con límites de palabra (\b) para coincidencia exacta
    const regex = new RegExp(`\\b${term.alias}\\b`, 'gi');
    const matches = workingText.match(regex);

    if (matches) {
      detectedCounts[term.canonical] = (detectedCounts[term.canonical] || 0) + matches.length;
      // Tachar la frase encontrada reemplazándola con un marcador para no volver a contarla
      workingText = workingText.replace(regex, '___');
    }
  }

  return detectedCounts;
};

// --- TAREA T2.2: AGREGACIÓN POR ÁREA EN RADAR ---

// Estructura que Abad (T2.1) nos pasará con las áreas y pesos de cada palabra
export type KeywordMapping = {
  area: RadarArea;
  weight: number;
};

// El diccionario cargado en memoria por el Backend
export type KeywordDictionaryMap = Record<string, KeywordMapping[]>;

/**
 * Calcula los puntos acumulados por área.
 * Regla de negocio: peso × min(count, 3)
 */
export const aggregateRadarScores = (
  detectedCounts: Record<string, number>,
  keywordMap: KeywordDictionaryMap
): Record<RadarArea, number> => {
  // 1. Inicializar el contador de puntos para las 6 áreas en 0
  const areaScores: Record<RadarArea, number> = {
    'software-development': 0,
    'cloud-devops': 0,
    'data-ai': 0,
    'quality-assurance': 0,
    'cybersecurity-networks': 0,
    'it-management': 0,
  };

  // 2. Recorrer cada palabra encontrada por el detector
  for (const [term, count] of Object.entries(detectedCounts)) {
    // Buscar a qué áreas pertenece esa palabra en el mapa que hizo Abad
    const termMappings = keywordMap[term];

    if (termMappings) {
      // 3. Aplicar el tope máximo de 3 repeticiones según el documento
      const effectiveCount = Math.min(count, 3);

      // 4. Sumar los puntos a cada área a la que pertenece la palabra
      for (const mapping of termMappings) {
        areaScores[mapping.area] += mapping.weight * effectiveCount;
      }
    }
  }

  return areaScores;
};