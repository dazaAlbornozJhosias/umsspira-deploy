/**
 * HU-6.4: disponibilidad del mentor (tabla `disponibilidad_mentor`, NO modificar).
 * El estado vive en su propia tabla: `mentor` no tiene columna de disponibilidad.
 * `hora_inicio` y `hora_fin` se dejan sin tocar (calendario semanal: "Próximamente").
 */

/** Estados válidos (CA-NF 03): se guardan exactamente así en `estado`. */
export enum MentorAvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  PAUSED = 'PAUSED',
  UNAVAILABLE = 'UNAVAILABLE',
}

/** Fila de `disponibilidad_mentor` (una por mentor; id_mentor NO tiene UNIQUE). */
export interface DisponibilidadMentor {
  id: string;
  id_mentor: string | null;
  estado: string | null;
  fecha_creacion: string | null;
  fecha_actualizacion: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
}

/** Respuesta de GET/PATCH /mentorship/availability. */
export interface MentorAvailability {
  availabilityStatus: MentorAvailabilityStatus | null;
  fecha_actualizacion: string | null;
}

/** CA-NF 03: ¿el valor recibido es uno de los tres estados válidos? */
export function isAvailabilityStatus(value: unknown): value is MentorAvailabilityStatus {
  return (
    typeof value === 'string' &&
    Object.values(MentorAvailabilityStatus).includes(value as MentorAvailabilityStatus)
  );
}

/**
 * Regla 8: como id_mentor no tiene UNIQUE, la fila vigente de cada mentor es la
 * más reciente (fecha_actualizacion, luego fecha_creacion y, para empates, id).
 */
export function latestRowByMentor(
  rows: DisponibilidadMentor[],
): Map<string, DisponibilidadMentor> {
  const latest = new Map<string, DisponibilidadMentor>();
  for (const row of rows) {
    if (!row.id_mentor) continue;
    const current = latest.get(row.id_mentor);
    if (!current || byRecency(row, current) < 0) latest.set(row.id_mentor, row);
  }
  return latest;
}

/** Orden descendente: primero la fila más reciente. */
function byRecency(a: DisponibilidadMentor, b: DisponibilidadMentor): number {
  const byUpdate = compareDesc(a.fecha_actualizacion, b.fecha_actualizacion);
  if (byUpdate !== 0) return byUpdate;
  const byCreation = compareDesc(a.fecha_creacion, b.fecha_creacion);
  if (byCreation !== 0) return byCreation;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

function compareDesc(x: string | null, y: string | null): number {
  if (x === y) return 0;
  if (x === null) return 1; // sin fecha cuenta como la más antigua
  if (y === null) return -1;
  return x < y ? 1 : -1;
}
