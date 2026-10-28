// apps/web/src/features/chat/utils/history.ts
// HU-08: utilidades para mostrar el historial agrupado por día.

const NO_DATE = 'sin-fecha';

const toDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Clave del día en hora local (YYYY-MM-DD). Sin fecha válida: «sin-fecha». */
export const dayKey = (iso: string | null | undefined): string => {
  const date = toDate(iso);
  if (!date) return NO_DATE;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Texto del separador, por ejemplo «16 oct 2025». Vacío si no hay fecha. */
export const formatDayLabel = (iso: string | null | undefined): string => {
  const date = toDate(iso);
  if (!date) return '';
  return date
    .toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .replace(/\./g, '');
};

/**
 * Indica si antes de `current` va un separador de día:
 * es el primer mensaje o cambió el día respecto a `previous`.
 */
export const shouldShowDaySeparator = (
  previous: string | null | undefined,
  current: string | null | undefined,
  isFirst: boolean,
): boolean => {
  if (dayKey(current) === NO_DATE) return false;
  return isFirst || dayKey(previous) !== dayKey(current);
};