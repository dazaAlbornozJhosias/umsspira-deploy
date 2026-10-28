import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ReportRepository } from '../ports/report-repository.port';
import type { GraduateListQuery } from '../contracts/report-inputs';
import { reportScope } from '../services/report-scope';

export class ListReportGraduatesUseCase {
  constructor(private readonly repository: ReportRepository) {}

  execute(actor: ActorContext, query: GraduateListQuery) {
    return this.repository.list(reportScope(actor, query.careerId), query);
  }
}
