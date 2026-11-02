import {
  AFFINITY_PERCENTAGE_DECIMALS,
  MAX_POSSIBLE_SCORE,
  TOP_FREQUENCY,
  TOP_KEYWORDS_LIMIT,
} from './affinity-config';

/** Representa una palabra clave detectada por NLP con su conteo de apariciones */
export interface KeywordMatch {
  term: string;
  count: number;
}

/** Representa el peso (1 a 5) que tiene una palabra clave en un área específica */
export interface AreaKeywordWeight {
  term: string;
  peso: number;
}

/** Aporte individual de una palabra clave al puntaje del área */
export interface KeywordContribution {
  keyword: string;
  weight: number;
  frequency: number;
  points: number;
  percentage: number;
}

/** Resultado del cálculo matemático para un área del radar */
export interface AreaCalculationResult {
  puntaje: number;               // Sumatoria de puntos (peso * frecuencia recortada)
  porcentaje: number;            // Valor final saturado entre 0 y 100 con 2 decimales
  ponderacion: number | null;    // El peso más alto detectado en esa área (1 a 5) o null si no hay keywords
  palabrasClaveTop: KeywordContribution[]; // Las palabras que más aportaron al área (máximo 5)
}

function roundPercentage(value: number): number {
  return Number(value.toFixed(AFFINITY_PERCENTAGE_DECIMALS));
}

/** Comparación determinista por código de carácter para desempatar aportes iguales. */
function compareKeywords(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Normaliza una instantánea de palabras clave influyentes leída de la base de datos.
 *
 * Reglas del contrato:
 * - descarta elementos incompletos o con aporte no positivo;
 * - elimina repetidos por término y conserva el de mayor aporte;
 * - ordena de mayor a menor `points` y desempata alfabéticamente por `keyword`;
 * - recorta a TOP_KEYWORDS_LIMIT elementos;
 * - recalcula `percentage` a partir de `points` para no confiar en datos antiguos.
 *
 * Es tolerante a `null` y a valores con forma inválida: devuelve un arreglo vacío.
 */
export function normalizeTopKeywords(value: unknown): KeywordContribution[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const byKeyword = new Map<string, KeywordContribution>();

  for (const item of value) {
    if (item === null || typeof item !== 'object') {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const keyword = typeof candidate.keyword === 'string' ? candidate.keyword.trim() : '';
    const weight = readFiniteNumber(candidate.weight);
    const frequency = readFiniteNumber(candidate.frequency);
    const points = readFiniteNumber(candidate.points);

    if (keyword.length === 0 || weight === null || frequency === null || points === null) {
      continue;
    }
    if (weight < 1 || weight > 5 || frequency <= 0 || points <= 0) {
      continue;
    }

    const contribution: KeywordContribution = {
      keyword,
      weight,
      frequency,
      points,
      percentage: roundPercentage((points * 100) / MAX_POSSIBLE_SCORE),
    };
    const key = keyword.toLowerCase();
    const previous = byKeyword.get(key);

    if (previous === undefined || contribution.points > previous.points) {
      byKeyword.set(key, contribution);
    }
  }

  return [...byKeyword.values()]
    .sort(
      (left, right) =>
        right.points - left.points || compareKeywords(left.keyword, right.keyword),
    )
    .slice(0, TOP_KEYWORDS_LIMIT);
}

/**
 * Función pura de dominio para calcular la afinidad de un área del radar.
 * Aplica saturación independiente: agregar keywords en un área no afecta a las otras.
 *
 * @param keywords Lista de palabras clave detectadas en el perfil del egresado
 * @param areaWeights Lista de pesos configurados en la base de datos para esta área
 */
export function calculateAreaAffinity(
  keywords: KeywordMatch[],
  areaWeights: AreaKeywordWeight[],
): AreaCalculationResult {
  // Mapa en minúsculas para buscar rápidamente el peso de cada palabra sin recorrer arreglos.
  // Si el catálogo repitiera un término, se conserva el peso mayor para no depender del orden.
  const weightMap = new Map<string, number>();
  for (const weight of areaWeights) {
    const term = weight.term.trim().toLowerCase();
    if (term.length === 0 || !Number.isFinite(weight.peso) || weight.peso < 1 || weight.peso > 5) {
      continue;
    }
    const previous = weightMap.get(term);
    weightMap.set(term, previous === undefined ? weight.peso : Math.max(previous, weight.peso));
  }

  // Agrupa por término para no contar dos veces la misma keyword. Si NLP repitiera
  // un término se conserva la frecuencia mayor.
  const frequencyByTerm = new Map<string, number>();
  for (const keyword of keywords) {
    if (!Number.isFinite(keyword.count) || keyword.count <= 0) {
      continue;
    }
    const term = keyword.term.trim().toLowerCase();
    if (term.length === 0) {
      continue;
    }
    const previous = frequencyByTerm.get(term);
    frequencyByTerm.set(term, previous === undefined ? keyword.count : Math.max(previous, keyword.count));
  }

  let puntajeTotal = 0;
  let maxWeight: number | null = null;
  const contributions: KeywordContribution[] = [];

  for (const [term, frequency] of frequencyByTerm) {
    const peso = weightMap.get(term);

    // La keyword solo aporta al área donde tiene peso configurado.
    if (peso === undefined) {
      continue;
    }

    // 1. Aplicar el tope de frecuencia (máximo 3) sin perder la frecuencia real.
    const cappedFrequency = Math.min(frequency, TOP_FREQUENCY);

    // 2. Calcular los puntos: aporte = peso * frecuencia recortada.
    const points = peso * cappedFrequency;

    if (points <= 0) {
      continue;
    }

    puntajeTotal += points;

    // 3. Guardar la ponderación más alta encontrada en esta área.
    if (maxWeight === null || peso > maxWeight) {
      maxWeight = peso;
    }

    contributions.push({
      keyword: term,
      weight: peso,
      frequency,
      points,
      percentage: roundPercentage((points * 100) / MAX_POSSIBLE_SCORE),
    });
  }

  // 4. Orden descendente por aporte, desempate alfabético y máximo cinco elementos.
  const topKeywords = normalizeTopKeywords(contributions);

  // 5. Calcular el porcentaje del área y aplicar saturación (clamp: nunca menor a 0 ni mayor a 100).
  const rawPercentage = (puntajeTotal * 100) / MAX_POSSIBLE_SCORE;
  const porcentaje = roundPercentage(Math.min(100, Math.max(0, rawPercentage)));

  return {
    puntaje: puntajeTotal,
    porcentaje,
    ponderacion: maxWeight,
    palabrasClaveTop: topKeywords,
  };
}
