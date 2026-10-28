import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { GraduateReport } from '../../domain/entities/graduate-report';
import type { ReportRepository } from '../ports/report-repository.port';
import type { ReportFilter } from '../contracts/report-inputs';
import { reportScope } from '../services/report-scope';

export class GetGraduateReportUseCase {
  constructor(private readonly repository: ReportRepository) {}

  async execute(actor: ActorContext, filter: ReportFilter): Promise<GraduateReport> {
    const source = await this.repository.exportData(reportScope(actor, filter.careerId), filter);
    if (!source.records.length) {
      throw new BusinessRuleError(
        'missing',
        'REPORT_EMPTY',
        'No hay registros que coincidan con los filtros para exportar',
      );
    }
    return { ...source, status: filter.status ?? null, generatedAt: new Date() };
  }
}
