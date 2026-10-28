import type {
  DashboardMetrics,
  GraduateReportPage,
  GraduateReportRecord,
} from '../../domain/entities/graduate-report';
import type { GraduateListQuery, ReportFilter } from '../contracts/report-inputs';

export const REPORT_REPOSITORY = Symbol('REPORT_REPOSITORY');

export interface ReportRepository {
  metrics(careerIds: readonly string[]): Promise<DashboardMetrics>;
  list(careerIds: readonly string[], query: GraduateListQuery): Promise<GraduateReportPage>;
  exportData(
    careerIds: readonly string[],
    filter: ReportFilter,
  ): Promise<{ records: GraduateReportRecord[]; careerNames: string[] }>;
}
