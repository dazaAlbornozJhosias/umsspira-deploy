import { randomUUID } from 'node:crypto';
import {
  CsvReportWriter,
  csvCell,
} from '../src/modules/reports/infrastructure/exporters/csv-report.writer';
import { PdfReportWriter } from '../src/modules/reports/infrastructure/exporters/pdf-report.writer';
import {
  careerDuration,
  reportDate,
} from '../src/modules/reports/domain/policies/report-format.policy';
import { canReceiveMentorship } from '../src/modules/mentorship/domain/policies/mentor.policy';
import type { GraduateReport } from '../src/modules/reports/domain/entities/graduate-report';

const report: GraduateReport = {
  careerNames: ['Ingeniería de Sistemas'],
  status: 'RECHAZADA',
  generatedAt: new Date('2026-10-18'),
  records: [
    {
      id: randomUUID(),
      careerId: randomUUID(),
      careerName: 'Ingeniería de Sistemas',
      firstName: '=HYPERLINK("ejemplo")',
      lastName: '',
      email: 'correo@example.com',
      phone: '+59170000000',
      identityNumber: '123',
      identityComplement: '',
      issuedIn: 'CB',
      sisCode: '202012345',
      graduationYear: null,
      admissionDate: null,
      graduationDate: null,
      submittedAt: null,
      reviewedAt: null,
      justification: '@SUM(1,2)',
      wantsMentorship: false,
      status: 'RECHAZADA',
    },
  ],
};
describe('Exportación institucional y reglas de disponibilidad', () => {
  it.each(['=1+1', '+123', '-123', '@SUM(1)', '  =1', '\ttexto'])(
    'neutraliza fórmulas: %s',
    (input) => {
      expect(csvCell(input)).toBe('"' + "'" + input + '"');
    },
  );
  it('escapa comillas y separadores sin perder acentos ni saltos de línea', () => {
    expect(csvCell('María, "Pérez"\nLópez')).toBe('"María, ""Pérez""\nLópez"');
  });
  it('exporta CSV UTF-8 con BOM, estados reales y datos ausentes explícitos', async () => {
    const file = await new CsvReportWriter().build(report);
    expect(file.bytes.subarray(0, 3).toString('hex')).toBe('efbbbf');
    expect(file.bytes.toString('utf8')).toContain('No disponible');
    expect(file.bytes.toString('utf8')).toContain('Rechazado');
    expect(file.bytes.toString('utf8')).toContain('"\'@SUM(1,2)"');
  });
  it('construye un PDF válido en memoria con el encabezado institucional', async () => {
    const file = await new PdfReportWriter().build(report);
    expect(file.bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(file.bytes.subarray(-20).toString()).toContain('%%EOF');
    expect(file.mime).toBe('application/pdf');
    expect(file.name).toBe('reporte-titulados-rechazada-2026-10-18.pdf');
  });
  it('calcula meses completos y no inventa fechas ni duraciones', () => {
    expect(careerDuration(new Date('2020-02-20'), new Date('2025-05-19'))).toBe('5 años, 2 meses');
    expect(careerDuration(new Date('2025-05-20'), new Date('2025-05-19'))).toBe('No disponible');
    expect(careerDuration(null, new Date())).toBe('No disponible');
    expect(reportDate(null)).toBe('No disponible');
    expect(reportDate(new Date('2026-10-18'))).toBe('18/10/2026');
  });
  it('solo un mentor activo y disponible puede recibir solicitudes', () => {
    expect(canReceiveMentorship(true, 'DISPONIBLE')).toBe(true);
    expect(canReceiveMentorship(false, 'DISPONIBLE')).toBe(false);
    expect(canReceiveMentorship(true, 'EN_PAUSA')).toBe(false);
    expect(canReceiveMentorship(true, 'NO_DISPONIBLE')).toBe(false);
    expect(canReceiveMentorship(true, null)).toBe(false);
  });
});
