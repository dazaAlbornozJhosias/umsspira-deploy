/**
 * Constantes de Dominio para el Cálculo de Afinidad del Radar.
 * Basado en las decisiones D1 y la Sección 11 del documento de Planning del Sprint 2.
 */

// Tope máximo de veces que una misma palabra clave aporta puntaje.
// Si un egresado menciona 'Docker' 5 veces, solo se le computan 3 para evitar spam.
export const TOP_FREQUENCY = 3;

// Puntaje máximo de referencia para normalizar a porcentaje (equivalente a 8 keywords de peso 5 con frecuencia 1).
// Cada área calcula su porcentaje independientemente: (puntaje * 100) / MAX_POSSIBLE_SCORE.
export const MAX_POSSIBLE_SCORE = 40;

// Versión del algoritmo y diccionario. Si en el futuro cambia el diccionario o las constantes,
// esta cadena cambia e invalida automáticamente los hashes anteriores, forzando un recálculo perezoso.
export const ALGORITHM_VERSION = '1.0.0/2026-10-22.1';