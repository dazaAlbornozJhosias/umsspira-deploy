import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ReportFilter } from '../contracts/report-inputs';
import type { ReportWriter } from '../ports/report-writer.port';
import { GetGraduateReportUseCase } from './get-graduate-report.use-case';

export class ExportReportPdfUseCase {
  constructor(
    private readonly reader: GetGraduateReportUseCase,
    private readonly writer: ReportWriter,
  ) {}
  async execute(actor: ActorContext, filter: ReportFilter) {
    return this.writer.build(await this.reader.execute(actor, filter));
  }
}
