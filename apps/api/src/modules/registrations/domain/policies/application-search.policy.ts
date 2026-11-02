export const MAX_SEARCH_TERMS = 6;

export function searchTerms(raw: string): string[] {
  const normalized = raw.trim().replace(/\s+/gu, ' ');
  if (!normalized) {return [];}

  const seen = new Set<string>();
  const terms: string[] = [];
  for (const term of normalized.split(' ')) {
    const key = term.toLocaleLowerCase();
    if (seen.has(key)) {continue;}
    seen.add(key);
    terms.push(term);
    if (terms.length === MAX_SEARCH_TERMS) {break;}
  }
  return terms;
}
