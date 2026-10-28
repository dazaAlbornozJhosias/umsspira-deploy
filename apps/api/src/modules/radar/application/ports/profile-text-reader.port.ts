/**
 * Puerto secundario (arquitectura hexagonal):
 * Define el contrato para leer los textos del perfil del titulado.
 * Desacopla el radar del módulo de Perfil (Épica 2) para que si ellos cambian su lógica,
 * el radar no se rompa.
 */

export interface ProfileTextSources {
  tituladoId: string;
  texts: string[]; // Segmentos de texto recopilados: formación, experiencia, certificación y descripción
}

// Token de inyección de dependencias para NestJS
export const PROFILE_TEXT_READER_PORT = Symbol('ProfileTextReaderPort');

export interface ProfileTextReaderPort {
  /**
   * Consulta las 4 fuentes en la base de datos:
   * 1. formacion_academica (titulo, institucion)
   * 2. experiencia_laboral (cargo, empresa)
   * 3. certificacion (nombre, entidad_emisora)
   * 4. perfil_area (descripcion_profesional)
   */
  getProfileTexts(tituladoId: string): Promise<ProfileTextSources>;
}