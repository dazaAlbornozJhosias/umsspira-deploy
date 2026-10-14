import PdfPrinter from 'pdfmake';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { GraduatesReportResponse, GraduateStatus } from '../types/graduates-report.types';
import { formatGenerationDate } from '../utils/build-report-file-name';
import { UMSS_LOGO_DATA_URL } from './umss-logo';

// Colores del sistema de diseño del portal (paleta MP072)
const COLOR_TEXT = '#1B2632';
const COLOR_BLUE = '#2C3B4D';
const COLOR_LINE = '#E2DCD0';
const COLOR_ZEBRA = '#F6F3ED';

const PAGE_MARGIN = 28;

// Fuentes estándar de PDF: no requieren archivos de fuentes en el servidor
const FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const TITLE_STATUS: Record<GraduateStatus, string> = {
  verified: 'Verificados',
  observed: 'Observados',
};


// Media línea de los títulos (7.5 pt × 1.2 / 2): centra verticalmente los títulos de una sola línea
const HEADER_HALF_LINE = 4.5;

// Títulos de las 9 columnas, iguales a la lista Titulados registrados
function buildHeaderRow(status: GraduateStatus): TableCell[] {
  const statusDateTitle = status === 'verified' ? 'Fecha de\nverificación' : 'Fecha de\nobservación';
  const titles = [
    'Nro',
    'Nombre completo',
    'Código\nSIS',
    'Teléfono',
    'Email institucional',
    'Fecha de\ningreso',
    'Fecha de\ntitulación',
    'Duración\nde carrera',
    statusDateTitle,
  ];
  return titles.map((text) => ({
    text,
    bold: true,
    color: '#FFFFFF',
    fontSize: 7.5,
    lineHeight: 1.2, // separa las dos líneas de los títulos largos
    alignment: 'center',
    // Los títulos de una línea bajan media línea para quedar centrados junto a los de dos
    margin: text.includes('\n') ? [0, 0, 0, 0] : [0, HEADER_HALF_LINE, 0, 0],
  }));
}

function buildInstitutionalHeader(report: GraduatesReportResponse, logo: string): Content[] {
  return [
    {
      columns: [
        { image: logo, width: 85 },
        {
          width: '*',
          margin: [14, 4, 0, 0],
          stack: [
            { text: 'Facultad de Ciencias y Tecnología', bold: true, fontSize: 9, color: COLOR_BLUE },
            { text: `Carrera de ${report.careerName}`, fontSize: 9, color: COLOR_BLUE, margin: [0, 2, 0, 0] },
          ],
        },
        {
          width: 'auto',
          margin: [0, 4, 0, 0],
          alignment: 'right',
          stack: [
            { text: 'Portal Titulados UMSS', bold: true, fontSize: 9, color: COLOR_BLUE },
            {
              text: `Reporte generado el ${formatGenerationDate(new Date(report.generatedAt))}`,
              fontSize: 8,
              color: COLOR_BLUE,
              margin: [0, 2, 0, 0],
            },
          ],
        },
      ],
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 786, y2: 0, lineWidth: 1.4, lineColor: COLOR_BLUE }],
      margin: [0, 8, 0, 10],
    },
    {
      text: `Reporte de titulados ${TITLE_STATUS[report.status]}`,
      fontSize: 16,
      bold: true,
      color: COLOR_TEXT,
    },
    {
      text: `Total: ${report.total} titulados ${TITLE_STATUS[report.status].toLowerCase()}`,
      fontSize: 8.5,
      color: COLOR_BLUE,
      margin: [0, 3, 0, 8],
    },
  ];
}

function buildTable(report: GraduatesReportResponse): Content {
  const body: TableCell[][] = [
    buildHeaderRow(report.status),
    ...report.graduates.map((graduate) => [
      { text: String(graduate.number), alignment: 'center' },
      { text: graduate.fullName },
      { text: graduate.sisCode, bold: true, alignment: 'center' },
      { text: graduate.phone },
      { text: graduate.email },
      { text: graduate.admissionDate, alignment: 'center' },
      { text: graduate.graduationDate, alignment: 'center' },
      { text: graduate.careerDuration, alignment: 'center' },
      { text: graduate.statusDate, alignment: 'center' },
    ] as TableCell[]),
  ];

  return {
    table: {
      headerRows: 1, // repite los títulos de columna en cada página
      dontBreakRows: true, // ninguna fila queda cortada entre dos páginas
      widths: [22, '*', 54, 64, '*', 52, 56, 72, 62],
      body,
    },
    layout: {
      fillColor: (rowIndex: number) =>
        rowIndex === 0 ? COLOR_BLUE : rowIndex % 2 === 0 ? COLOR_ZEBRA : null,
      hLineWidth: (index: number) => (index === 0 ? 0 : 0.5),
      vLineWidth: () => 0.5,
      hLineColor: () => COLOR_LINE,
      vLineColor: () => COLOR_LINE,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
    fontSize: 7.5,
    color: COLOR_TEXT,
  };
}

// Documento PDF del reporte: hoja A4 horizontal, encabezado institucional en la primera
// página, tabla con títulos repetidos y «Página N de M» al pie.
type PdfPrinterConstructor = new (fonts: typeof FONTS) => {
  createPdfKitDocument: (docDefinition: TDocumentDefinitions) => NodeJS.ReadableStream & {
    end: () => void;
  };
};
export function buildGraduatesReportPdf(
  report: GraduatesReportResponse,
  fileName: string,
): Promise<Buffer> {
  const logo = UMSS_LOGO_DATA_URL;

  const definition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN, 44],
    defaultStyle: { font: 'Helvetica' },
    info: {
      title: `Reporte de titulados ${TITLE_STATUS[report.status]}`,
      author: 'Portal Titulados UMSS',
    },
    content: [...buildInstitutionalHeader(report, logo), buildTable(report)],
    footer: (currentPage: number, pageCount: number): Content => ({
      margin: [PAGE_MARGIN, 10, PAGE_MARGIN, 0],
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 786, y2: 0, lineWidth: 0.6, lineColor: COLOR_LINE }] },
        {
          columns: [
            { text: 'Portal Titulados UMSS', width: '*' },
            { text: fileName, width: 'auto', alignment: 'center' },
            { text: `Página ${currentPage} de ${pageCount}`, width: '*', alignment: 'right' },
          ],
          fontSize: 7.5,
          color: COLOR_BLUE,
          margin: [0, 6, 0, 0],
        },
      ],
    }),
  };

return new Promise((resolve, reject) => {
    try {
      const document = new (PdfPrinter as unknown as PdfPrinterConstructor)(FONTS).createPdfKitDocument(definition);
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
      document.end();
    } catch (error) {
      reject(error);
    }
  });
}
