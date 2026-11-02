import { createHash } from 'crypto';
import { ALGORITHM_VERSION } from './affinity-config';

/**
 * Normaliza los textos del perfil para el hash de entrada.
 * Se ordenan para que cambiar el orden de las certificaciones no altere el hash.
 */
export function normalizeTextsForHash(texts: readonly string[]): string {
  return texts
    .map((text) => text.trim().toLowerCase())
    .filter((text) => text.length > 0)
    .sort()
    .join('|');
}

/**
 * Hash SHA-256 de la entrada del cálculo. El prefijo con la versión del algoritmo
 * invalida los hashes anteriores cuando cambia el diccionario o las constantes.
 * No modificar esta fórmula sin reportarlo: todos los hashes guardados quedarían obsoletos.
 */
export function calculateInputHash(texts: readonly string[]): string {
  return createHash('sha256')
    .update(`${ALGORITHM_VERSION}|${normalizeTextsForHash(texts)}`)
    .digest('hex');
}
