export interface CrearFormacionAcademicaDto {
  institucion: string;
  titulo: string;
  grado: string;
  anioEgreso: number;
}

export interface CrearExperienciaLaboralDto {
  empresa: string;
  cargo: string;
  fechaInicio: string;
  // Sin fecha de fin = trabajo actual
  fechaFin?: string;
}

export interface CrearCertificacionDto {
  nombre: string;
  entidadEmisora: string;
  grado: string;
  anioEmision: number;
}
