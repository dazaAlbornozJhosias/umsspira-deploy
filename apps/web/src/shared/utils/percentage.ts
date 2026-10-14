/**
 * Formatea y redondea porcentajes recibidos desde el backend/API.
 * Garantiza un número entero en el rango cerrado [0, 100].
 *
 * @param value Porcentaje en formato numérico (ej. 82.5, 105, -5, NaN)
 * @returns Número entero entre 0 y 100
 */
export function clampPercentage(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.round(value);
  return Math.min(100, Math.max(0, rounded));
}

/**
 * Retorna el porcentaje redondeado y clampeado formateado con el símbolo %.
 * Ejemplos:
 * 82.5 => "83%"
 * -5 => "0%"
 * 105 => "100%"
 *
 * @param value Porcentaje numérico
 * @returns String formateado (ej: "83%")
 */
export function formatPercentage(value: number | null | undefined): string {
  const clamped = clampPercentage(value);
  return `${clamped}%`;
}
