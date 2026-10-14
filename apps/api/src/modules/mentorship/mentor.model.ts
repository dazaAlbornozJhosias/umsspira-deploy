/**
 * Fila de la tabla `mentor` (compartida, NO modificar).
 * `id` es el UUID de `usuario.usuario_id` (relación 1:1 implícita).
 * Las fechas son DATE de Postgres: se envían y reciben como 'YYYY-MM-DD'.
 */
export interface Mentor {
  id: string;
  experiencia: string | null;
  esta_activo: boolean | null;
  anios_exp: number | null;
  fecha_creacion: string | null;
  fecha_actualizacion: string | null;
}
