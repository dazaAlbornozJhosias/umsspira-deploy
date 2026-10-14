export const SECCIONES = {
  'formacion-academica': { tabla: 'formacion_academica' },
  'experiencia-laboral': { tabla: 'experiencia_laboral' },
  'certificaciones': { tabla: 'certificacion' },
} as const;
export type Seccion = keyof typeof SECCIONES;
export const COLUMNA_TITULADO = 'id_titulado';
export const TABLA_TITULADO = 'titulado';
export const TABLA_RESPALDO = 'certificacion_respaldo';
// Columnas de cada sección: nombre en la API (camelCase) -> nombre en la BD
export const COLUMNAS: Record<Seccion, Record<string, string>> = {
  'formacion-academica': {
    institucion: 'institucion',
    titulo: 'titulo',
    grado : 'grado',
    anioEgreso: 'anio_egreso',
  },
  'experiencia-laboral': {
    empresa: 'empresa',
    cargo: 'cargo',
    fechaInicio: 'fecha_inicio',
    fechaFin: 'fecha_fin',
  },
  'certificaciones': {
    nombre: 'nombre',
    entidadEmisora: 'entidad_emisora',
    grado: 'grado',
    anioEmision: 'anio_emision',
  },
};
// Columnas comunes a las 3 tablas
export const COLUMNA_ID = 'id';
export const COLUMNA_FECHA_CREACION = 'fecha_creacion';
// Columnas de certificacion_respaldo
export const COLUMNAS_RESPALDO = {
  idCertificacion: 'id_certificacion',
  tipo: 'tipo',
  archivoKey: 'archivo_key',
  fechaSubida: 'fecha_subida',
} as const;
export type TipoRespaldo = 'FOTO' | 'DOCUMENTO';
// Bucket de Supabase Storage donde se guardan los archivos de respaldo (T1.9)
export const BUCKET_RESPALDOS = 'respaldos-certificacion';
// Comprueba que un texto recibido (por ejemplo :seccion de la URL) sea una sección válida
export function esSeccion(valor: string): valor is Seccion {
  return Object.prototype.hasOwnProperty.call(SECCIONES, valor);
}