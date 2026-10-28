const DIACRITICS = /\p{M}/gu;
const DISALLOWED_CHARACTERS = /[^a-z0-9+#._\s]/g;
const WHITESPACE = /\s+/;
const LEADING_SEPARATORS = /^[._+#]+/;
const TRAILING_SEPARATORS = /[._]+$/;
const SEGMENT_BREAK = /\r\n|\r|\n/;

/** Normaliza y tokeniza una frase o un campo. Devuelve tokens. */
export function normalizeText(text: string): string[] {
  const withoutDiacritics = text.normalize('NFD').replace(DIACRITICS, '');
  const withSeparators = withoutDiacritics.toLowerCase().replace(DISALLOWED_CHARACTERS, ' ');

  const tokens: string[] = [];
  for (const rawToken of withSeparators.split(WHITESPACE)) {
    const token = rawToken.replace(LEADING_SEPARATORS, '').replace(TRAILING_SEPARATORS, '');
    if (token.length > 0) {
      tokens.push(token);
    }
  }
  return tokens;
}

/**
 * Separa un texto en segmentos por salto de línea (\n o \r\n),
 * recorta espacios y descarta vacíos. Se aplica antes de normalizar.
 */
export function splitSegments(text: string): string[] {
  return text
    .split(SEGMENT_BREAK)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

/**
 * Conveniencia: normalizeText(text).join(' '). Es la forma que se guarda
 * en BD (termino_normalizado / alias_normalizado) y la que usará el hash.
 */
export function normalizePhrase(text: string): string {
  return normalizeText(text).join(' ');
}
