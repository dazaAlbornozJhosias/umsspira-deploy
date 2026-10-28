import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ReportRepository } from '../ports/report-repository.port';
import { reportScope } from '../services/report-scope';

export class GetReportMetricsUseCase {
  constructor(private readonly repository: ReportRepository) {}

  execute(actor: ActorContext, careerId?: string) {
    return this.repository.metrics(reportScope(actor, careerId));
  }
}
