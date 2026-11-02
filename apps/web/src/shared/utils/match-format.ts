export const MATCH_UNAVAILABLE_LABEL = "No disponible";

/* Umbrales SOLO para etiquetas y colores (no cambian el porcentaje recibido). */
export const MATCH_LEVEL_HIGH = 75;
export const MATCH_LEVEL_MEDIUM = 50;
export const BAR_GREEN_THRESHOLD = 80;

export type MatchLevel = "Alta" | "Media" | "Baja";

/** Hay un porcentaje válido recibido de la API (CA-10). */
export function hasMatch(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Texto a mostrar: valor recibido o "No disponible" (CA-02, CA-05, CA-10). */
export function formatMatch(value: number | null | undefined): string {
  return hasMatch(value) ? `${value}%` : MATCH_UNAVAILABLE_LABEL;
}

/** Solo para dibujar barras/donas: acota el ancho visual. */
export function clampForDisplay(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** Etiqueta "Alta / Media / Baja" derivada del valor recibido. null si no hay valor. */
export function getMatchLevel(value: number | null | undefined): MatchLevel | null {
  if (!hasMatch(value)) return null;
  if (value >= MATCH_LEVEL_HIGH) return "Alta";
  if (value >= MATCH_LEVEL_MEDIUM) return "Media";
  return "Baja";
}

/** Color de la barra en la lista (mockup: verde alto, azul el resto). */
export function listBarColor(value: number | null | undefined): string {
  return hasMatch(value) && value >= BAR_GREEN_THRESHOLD ? "bg-emerald-500" : "bg-sky-500";
}

/** Color de las barras por habilidad (mockup: verde alto, naranja el resto). */
export function skillBarColor(value: number | null | undefined): string {
  return hasMatch(value) && value >= BAR_GREEN_THRESHOLD ? "bg-emerald-500" : "bg-amber-400";
}