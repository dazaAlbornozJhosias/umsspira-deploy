/** Iniciales para el avatar (máximo 2 letras). */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/** "2025-09-10" -> "10/09/2025" (sin convertir zonas horarias). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [datePart] = iso.split("T");
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}