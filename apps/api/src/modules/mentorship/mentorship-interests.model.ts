/**
 * Filas de las tablas `area` y `mentor_area` (esquema compartido, NO modificar).
 * Un interés es un `area` con `padre_id` no nulo; su padre es un área raíz
 * (`padre_id` IS NULL). Ambos se guardan en `mentor_area`.
 */

/** Fila de la tabla `area`. */
export interface Area {
  id: string;
  nombre: string | null;
  padre_id: string | null;
  esta_activo: boolean | null;
  fecha_creacion: string | null;
  fecha_actualizacion: string | null;
}

/** Fila de la tabla `mentor_area` (sin UNIQUE: el servicio valida duplicados). */
export interface MentorArea {
  id: string;
  id_mentor: string | null;
  id_area: string | null;
  fecha_creacion: string | null;
}

/** Área resumida que viaja en las respuestas (regla 8). */
export interface AreaResumen {
  id: string;
  nombre: string;
}

/** Interés del catálogo o del mentor (regla 8: id, nombre y área padre). */
export interface MentorInterest {
  id: string;
  nombre: string;
  area: AreaResumen;
}

/** Interés del catálogo, marcado si el mentor ya lo seleccionó. */
export interface InterestCatalogItem extends MentorInterest {
  seleccionado: boolean;
}

/** Intereses disponibles agrupados por su área técnica. */
export interface InterestCatalogGroup {
  area: AreaResumen;
  intereses: InterestCatalogItem[];
}

/** Resultado de quitar un interés seleccionado. */
export interface RemovedInterest {
  id: string;
  eliminado: boolean;
}
