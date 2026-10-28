import type { ReportStatus } from '../../domain/entities/graduate-report';

export interface ReportFilter {
  careerId?: string;
  status?: ReportStatus;
  search?: string;
}

export interface GraduateListQuery extends ReportFilter {
  page: number;
  limit: number;
}

export interface ReportFile {
  bytes: Buffer;
  name: string;
  mime: string;
}
