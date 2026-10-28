import type { TimelineItem, TimelineSection } from '@/modules/profile/data/profile-data';

const MONTHS: Record<string, number> = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dic: 12,
};

/** Convierte "2018", "Jul 2023" o "Presente" en un número comparable (meses). Sin fecha -> null. */
function toMonths(text: string): number | null {
  if (/presente|actual/i.test(text)) return Number.POSITIVE_INFINITY;
  const match = text.match(/(?:([a-z]{3})[a-z]*\.?\s+)?(\d{4})/i);
  if (!match) return null;
  const month = match[1] ? (MONTHS[match[1].toLowerCase()] ?? 0) : 0;
  return Number(match[2]) * 12 + month;
}

/** Clave de orden [fin, inicio]: en rangos "Ene 2021 – Jun 2023" manda la fecha de fin. */
function recencyKey(item: TimelineItem): [number, number] {
  // Las certificaciones traen su año aparte; sin él se lee del subtítulo: "Amazon Web Services · 2022"
  const parts = (item.date ?? item.year ?? item.subtitle).split(/\s[–-]\s/);
  const start = toMonths(parts[0]) ?? Number.NEGATIVE_INFINITY;
  const end = toMonths(parts[parts.length - 1]) ?? start;
  return [end, start];
}

/** Ordena los ítems de cada sección del más reciente al más antiguo; los que no tienen fecha van al final. */
export function sortSectionsByRecency(sections: TimelineSection[]): TimelineSection[] {
  return sections.map((section) => ({
    ...section,
    items: [...section.items].sort((a, b) => {
      const [endA, startA] = recencyKey(a);
      const [endB, startB] = recencyKey(b);
      if (endA !== endB) return endB > endA ? 1 : -1;
      if (startA !== startB) return startB > startA ? 1 : -1;
      return 0;
    }),
  }));
}
