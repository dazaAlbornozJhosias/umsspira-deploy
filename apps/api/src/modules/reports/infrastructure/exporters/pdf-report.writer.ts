import PdfPrinter from 'pdfmake';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { ReportWriter } from '../../application/ports/report-writer.port';
import type { GraduateReport } from '../../domain/entities/graduate-report';
import {
  careerDuration,
  reportDate,
  REPORT_LABELS,
} from '../../domain/policies/report-format.policy';
import { UMSS_LOGO_DATA_URL } from './assets/umss-logo';

const FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};
const BLUE = '#2C3B4D';

function reportTable(report: GraduateReport): Content {
  const headers = [
    'Nro',
    'Nombre completo / Carrera',
    'Código SIS',
    'Teléfono',
    'Correo electrónico',
    'Ingreso',
    'Titulación',
    'Duración',
    'Revisión',
    'Estado',
  ];
  const rows: TableCell[][] = [
    headers.map((text) => ({ text, bold: true, color: '#FFFFFF', fillColor: BLUE })),
  ];
  for (const [index, record] of report.records.entries()) {
    rows.push([
      String(index + 1),
      {
        stack: [
          { text: record.lastName + ', ' + record.firstName, bold: true },
          { text: record.careerName, color: '#536372', fontSize: 6.5 },
        ],
      },
      record.sisCode,
      record.phone || '-',
      record.email,
      reportDate(record.admissionDate),
      reportDate(record.graduationDate),
      careerDuration(record.admissionDate, record.graduationDate),
      reportDate(record.reviewedAt),
      REPORT_LABELS[record.status],
    ]);
    if (record.justification) {
      rows.push([
        {
          text: 'Observación / justificación: ' + record.justification,
          colSpan: 10,
          color: '#536372',
          fontSize: 7,
        },
        ...Array.from({ length: 9 }, () => ({})),
      ]);
    }
  }
  return {
    table: {
      headerRows: 1,
      dontBreakRows: false,
      widths: [18, '*', 42, 50, 100, 46, 46, 58, 56, 50],
      body: rows,
    },
    fontSize: 7.5,
    layout: {
      hLineColor: () => '#D9DFE4',
      vLineColor: () => '#D9DFE4',
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      paddingTop: () => 5,
      paddingBottom: () => 5,
      fillColor: (index: number) => (index === 0 ? BLUE : index % 2 === 0 ? '#F6F3ED' : null),
    },
  };
}

export class PdfReportWriter implements ReportWriter {
  async build(report: GraduateReport) {
    const name =
      'reporte-titulados-' +
      (report.status?.toLowerCase() ?? 'todos') +
      '-' +
      report.generatedAt.toISOString().slice(0, 10) +
      '.pdf';
    const definition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [28, 28, 28, 42],
      defaultStyle: { font: 'Helvetica', color: '#1B2632' },
      info: { title: 'Registro de titulados UMSS', author: 'UMSSPIRA' },
      content: [
        {
          columns: [
            { image: UMSS_LOGO_DATA_URL, width: 62 },
            {
              width: '*',
              margin: [14, 5, 0, 0],
              stack: [
                { text: 'Universidad Mayor de San Simón', bold: true, fontSize: 12 },
                {
                  text: 'Registro de titulados - ' + report.careerNames.join(', '),
                  fontSize: 9,
                  margin: [0, 5, 0, 0],
                },
                {
                  text:
                    'Estado: ' +
                    (report.status ? REPORT_LABELS[report.status] : 'Todos') +
                    ' | Total: ' +
                    report.records.length,
                  fontSize: 9,
                  margin: [0, 5, 0, 0],
                },
                {
                  text: 'Generado: ' + report.generatedAt.toISOString(),
                  fontSize: 8,
                  margin: [0, 5, 0, 0],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 14],
        },
        reportTable(report),
      ],
      footer: (page: number, total: number): Content => ({
        margin: [28, 12, 28, 0],
        fontSize: 8,
        color: BLUE,
        columns: [
          { text: 'UMSSPIRA - Reporte institucional', width: '*' },
          { text: 'Página ' + page + ' de ' + total, alignment: 'right', width: 'auto' },
        ],
      }),
    };
    const bytes = await new Promise<Buffer>((resolve, reject) => {
      const document = new PdfPrinter(FONTS).createPdfKitDocument(definition);
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('error', reject);
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.end();
    });
    return { bytes, name, mime: 'application/pdf' };
  }
}
