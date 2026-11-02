import { clampPercentage } from './percentage';

/**
 * Calcula la variación de afinidad en puntos porcentuales.
 *
 * La resta se hace sobre los porcentajes ya redondeados y limitados a [0, 100]
 * que ve la persona, no sobre los decimales que guarda el backend. Por eso dos
 * mediciones distintas que se redondean al mismo entero (40,2 y 40,4) no
 * producen indicador, y una diferencia de 0,5 puede valer 1 punto.
 *
 * @param current Afinidad del cálculo actual.
 * @param previous Afinidad del cálculo anterior, o null en el primer cálculo.
 * @returns Delta entero con signo, o null si no corresponde mostrar indicador.
 */
export function calculateVariation(
  current: number | null | undefined,
  previous: number | null | undefined,
): number | null {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous)
  ) {
    return null;
  }

  const delta = clampPercentage(current) - clampPercentage(previous);
  return delta === 0 ? null : delta;
}

/**
 * Formatea un delta entero para la interfaz: "+8 %", "\u22123 %" o "0 %".
 *
 * Los positivos llevan signo explícito, los negativos usan el signo menos
 * tipográfico (U+2212) y siempre hay un espacio antes del símbolo de porcentaje.
 *
 * @param delta Delta entero devuelto por calculateVariation.
 * @returns Texto listo para mostrar, sin decimales.
 */
export function formatVariation(delta: number): string {
  const rounded = Math.round(delta);
  if (rounded === 0) return '0 %';
  const sign = rounded > 0 ? '+' : '\u2212';
  return `${sign}${Math.abs(rounded)} %`;
}
