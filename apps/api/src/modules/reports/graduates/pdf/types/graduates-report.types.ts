// Estados de titulado que se pueden exportar en el reporte (HU4).
// En la API van en inglés; en la base de datos se guardan en español.
export type GraduateStatus = 'verified' | 'observed';

export const GRADUATE_STATUSES: GraduateStatus[] = ['verified', 'observed'];

// Fila del reporte: los mismos datos que muestra la lista Titulados registrados.
export interface GraduateReportRow {
  number: number;
  fullName: string;
  sisCode: string;
  phone: string;
  email: string;
  admissionDate: string;
  graduationDate: string;
  careerDuration: string;
  statusDate: string;
}

// Respuesta del endpoint de consulta; la reutiliza la exportación a PDF.
export interface GraduatesReportResponse {
  careerName: string;
  status: GraduateStatus;
  total: number;
  generatedAt: string;
  graduates: GraduateReportRow[];
}
