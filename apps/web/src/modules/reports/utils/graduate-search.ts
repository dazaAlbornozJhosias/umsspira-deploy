/**
 * HU-004 QA (Bugs 1, 2, 4): busqueda normalizada y relevancia de coincidencias.
 * Utilidad pura para no acoplar los algoritmos al renderizado de /reports.
 */
export interface SearchableGraduate {
  fullName: string;
  sisCode: string;
}

export function normalizeGraduateSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function matchRank(record: SearchableGraduate, query: string): number {
  const name = normalizeGraduateSearch(record.fullName);
  const sis = normalizeGraduateSearch(record.sisCode);
  const words = name.split(' ');

  if (name === query || sis === query) return 0;
  if (name.startsWith(query) || sis.startsWith(query)) return 1;
  if (words.some((word) => word.startsWith(query))) return 2;
  if (name.includes(query) || sis.includes(query)) return 3;

  // Una busqueda "Perez, Ana" tambien coincide con "Ana Perez".
  const tokens = query.split(' ');
  if (tokens.length > 1 && tokens.every(
    (token) => words.some((word) => word.startsWith(token)),
  )) return 4;

  return Number.POSITIVE_INFINITY;
}

/**
 * Conserva el orden original cuando no hay busqueda; al buscar, primero
 * exactas, luego iniciales y finalmente parciales (orden estable en empates).
 */
export function searchAndRankGraduates<T extends SearchableGraduate>(
  graduates: readonly T[],
  rawQuery: string,
): T[] {
  const query = normalizeGraduateSearch(rawQuery);
  if (!query) return [...graduates];

  return graduates
    .map((graduate, index) => ({ graduate, index, rank: matchRank(graduate, query) }))
    .filter(({ rank }) => Number.isFinite(rank))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ graduate }) => graduate);
}
