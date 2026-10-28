import type { ReportWriter } from '../../application/ports/report-writer.port';
import type { GraduateReport } from '../../domain/entities/graduate-report';
import {
  careerDuration,
  reportDate,
  REPORT_LABELS,
} from '../../domain/policies/report-format.policy';

export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  // Las celdas de texto no deben convertirse en fórmulas al abrir el archivo en una hoja de cálculo.
  if (/^[\t\r\n]|^\s*[=+\-@]/.test(text)) {
    text = "'" + text;
  }
  return '"' + text.replaceAll('"', '""') + '"';
}

export class CsvReportWriter implements ReportWriter {
  async build(report: GraduateReport) {
    const header = [
      'Nro',
      'Número de registro',
      'Nombre completo',
      'Carrera',
      'Código SIS',
      'Teléfono',
      'Correo electrónico',
      'Fecha de ingreso',
      'Fecha de titulación',
      'Duración de estudio',
      'Fecha de revisión',
      'Observación o rechazo',
      'Estado',
    ];
    const rows = report.records.map((record, index) => [
      index + 1,
      record.id,
      record.lastName + ', ' + record.firstName,
      record.careerName,
      record.sisCode,
      record.phone,
      record.email,
      reportDate(record.admissionDate),
      reportDate(record.graduationDate),
      careerDuration(record.admissionDate, record.graduationDate),
      reportDate(record.reviewedAt),
      record.justification ?? '',
      REPORT_LABELS[record.status],
    ]);
    const content =
      '\uFEFF' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
    return {
      bytes: Buffer.from(content, 'utf8'),
      name:
        'nomina-egresados-' +
        (report.status?.toLowerCase() ?? 'todos') +
        '-' +
        report.generatedAt.toISOString().slice(0, 10) +
        '.csv',
      mime: 'text/csv; charset=utf-8',
    };
  }
}
