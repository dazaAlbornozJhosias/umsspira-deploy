import type { GraduateReport } from '../../domain/entities/graduate-report';
import type { ReportFile } from '../contracts/report-inputs';

export const REPORT_CSV_WRITER = Symbol('REPORT_CSV_WRITER');
export const REPORT_PDF_WRITER = Symbol('REPORT_PDF_WRITER');

export interface ReportWriter {
  build(report: GraduateReport): Promise<ReportFile>;
}
