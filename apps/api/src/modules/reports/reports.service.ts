import { Injectable } from '@nestjs/common';
import { MOCK_GRADUATES, GraduateRecordMock } from './mocks/reports-data.mock';
import { GetGraduatesQueryDto } from './dto/get-graduates-query.dto';

export interface DashboardMetricsResponse {
  totalGraduates: number;
  verifiedGraduates: number;
  observedGraduates: number;
  activeMentors: number;
}

export interface PaginatedGraduatesResponse {
  data: GraduateRecordMock[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ReportsService {
  private readonly records: GraduateRecordMock[] = MOCK_GRADUATES;

  getMetrics(): DashboardMetricsResponse {
    const totalGraduates = this.records.length;
    const verifiedGraduates = this.records.filter((r) => r.estado === 'VERIFICADO').length;
    const observedGraduates = this.records.filter((r) => r.estado === 'OBSERVADO').length;
    const activeMentors = this.records.filter(
      (r) => r.estado === 'VERIFICADO' && r.deseaMentor,
    ).length;

    return {
      totalGraduates,
      verifiedGraduates,
      observedGraduates,
      activeMentors,
    };
  }

  getGraduates(query: GetGraduatesQueryDto): PaginatedGraduatesResponse {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.max(1, parseInt(query.limit ?? '10', 10));

    let filtered = [...this.records];

    if (query.status) {
      filtered = filtered.filter((r) => r.estado === query.status);
    }

    if (query.search) {
      const term = query.search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.nombre.toLowerCase().includes(term) ||
          r.apellido.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          r.codSis.includes(term) ||
          r.ci.includes(term),
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}