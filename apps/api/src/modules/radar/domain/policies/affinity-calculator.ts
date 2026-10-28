import { TOP_FREQUENCY, MAX_POSSIBLE_SCORE } from './affinity-config';

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

/** Resultado del cálculo matemático para un área del radar */
export interface AreaCalculationResult {
  puntaje: number;               // Sumatoria de puntos (peso * frecuencia recortada)
  porcentaje: number;            // Valor final saturado entre 0 y 100 con 2 decimales
  ponderacion: number | null;     // El peso más alto detectado en esa área (1 a 5) o null si no hay keywords
  palabrasClaveTop: Array<{      // Las palabras que más aportaron al área (máximo 5)
    keyword: string;
    weight: number;
    frequency: number;
    points: number;
    percentage: number;
  }>;
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
  areaWeights: AreaKeywordWeight[]
): AreaCalculationResult {
  // Mapa en minúsculas para buscar rápidamente el peso de cada palabra sin recorrer arreglos
  const weightMap = new Map<string, number>(
    areaWeights.map((w) => [w.term.toLowerCase(), w.peso])
  );

  let puntajeTotal = 0;
  let maxWeight: number | null = null;
  const contributions: AreaCalculationResult['palabrasClaveTop'] = [];

  // Iterar por cada palabra detectada en el texto del egresado
  for (const kw of keywords) {
    const termNorm = kw.term.toLowerCase();
    const peso = weightMap.get(termNorm);

    // Si la palabra pertenece a esta área y tiene peso asignado
    if (peso !== undefined && peso > 0) {
      // 1. Aplicar el tope de frecuencia (máximo 3)
      const freq = Math.min(kw.count, TOP_FREQUENCY);
      
      // 2. Calcular los puntos: aporte = peso * frecuencia
      const points = peso * freq;
      
      // 3. Calcular qué porcentaje representa ese aporte individual frente al total posible (40)
      const percentage = (points * 100) / MAX_POSSIBLE_SCORE;

      puntajeTotal += points;

      // 4. Guardar la ponderación más alta encontrada en esta área
      if (maxWeight === null || peso > maxWeight) {
        maxWeight = peso;
      }

      contributions.push({
        keyword: kw.term,
        weight: peso,
        frequency: freq,
        points,
        percentage: Number(percentage.toFixed(2)),
      });
    }
  }

  // 5. Ordenar de mayor a menor según los puntos aportados y tomar las 5 más influyentes
  contributions.sort((a, b) => b.points - a.points);
  const topKeywords = contributions.slice(0, 5);

  // 6. Calcular el porcentaje del área y aplicar saturación (clamp: nunca menor a 0 ni mayor a 100)
  const rawPercentage = (puntajeTotal * 100) / MAX_POSSIBLE_SCORE;
  const porcentaje = Number(Math.min(100, Math.max(0, rawPercentage)).toFixed(2));

  return {
    puntaje: puntajeTotal,
    porcentaje,
    ponderacion: maxWeight,
    palabrasClaveTop: topKeywords,
  };
}