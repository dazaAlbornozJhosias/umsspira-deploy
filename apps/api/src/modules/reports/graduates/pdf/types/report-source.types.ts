// Forma de los datos tal como vienen de la base de datos (nombres de columna en español).
// La comparten la consulta a Supabase y los datos de prueba.

export interface ApplicationDetailRow {
  nombre: string;
  apellido: string;
  cod_sis: string | number;
  telefono: string | null;
  email: string;
  fecha_ingreso: string | null;
  fecha_titulacion: string | null;
  id_carrera: string;
  // Sólo en los datos de prueba: el texto de «Duración de estudio» de la tabla de /reports,
  // para que el PDF muestre lo mismo que la lista. En la base de datos se calcula con las fechas.
  duracion_carrera?: string | null;
}

export interface ApplicationRow {
  estado: string;
  detalle_solicitud: ApplicationDetailRow;
  dictamen: { fecha_creacion: string } | null;
}

export interface CareerRow {
  id: string;
  nombre: string;
}

// Datos de una carrera: lo que devuelve el repositorio para armar el reporte
export interface ReportSourceData {
  carrera: CareerRow;
  solicitudes: ApplicationRow[];
}

// Datos de prueba: varias carreras (Sistemas e Informática) con sus solicitudes
export interface ReportMockData {
  carreras: CareerRow[];
  solicitudes: ApplicationRow[];
}
