// Estados de titulado que se pueden exportar (los mismos que acepta la API).
export type GraduateStatus = 'verified' | 'observed';

// Etapas de la exportación a PDF.
// generating: se está pidiendo el PDF a la API; preview: llegó el PDF y se muestra la vista previa;
// empty: el estado no tiene titulados; error: no se pudo generar el PDF.
export type ExportState = 'idle' | 'generating' | 'preview' | 'empty' | 'error';

export interface ReportPdfFile {
  file: Blob;
  fileName: string;
}
