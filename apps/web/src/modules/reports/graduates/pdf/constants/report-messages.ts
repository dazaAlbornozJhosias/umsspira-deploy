import { GraduateStatus } from '../types/graduates-report.types';

export const STATUS_LABEL: Record<GraduateStatus, string> = {
  verified: 'verificados',
  observed: 'observados',
};

// Estados que ofrece el menú cuando la pantalla todavía no le indica cuál exportar
export const EXPORTABLE_STATUSES: GraduateStatus[] = ['verified', 'observed'];

// Zona horaria con la que la API arma la fecha del nombre del archivo
export const REPORT_TIME_ZONE = 'America/La_Paz';

// Tiempo máximo de espera del PDF; pasado ese tiempo se avisa que no se pudo generar
export const EXPORT_TIMEOUT_MS = 30_000;

// Textos de la exportación a PDF, iguales a los criterios de aceptación de QA
export const REPORT_MESSAGES = {
  exportButton: 'Exportar',
  generating: 'Generando…',
  pdfOption: 'PDF',
  pdfOptionFor: (status: GraduateStatus) => `PDF de ${STATUS_LABEL[status]}`,
  pdfOptionDetail: 'Documento con formato institucional',
  menuTitle: 'Exportar como',
  cancel: 'Cancelar',
  understood: 'Entendido',
  alertTitle: 'Aviso de exportación',
  generationError: 'No se pudo generar el reporte PDF. Intente nuevamente.',
  previewLoading: 'Cargando vista previa…',
  previewUnavailable: 'No se pudo mostrar la vista previa. Puede descargar o imprimir el reporte.',
};
