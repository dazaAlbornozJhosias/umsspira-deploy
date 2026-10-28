import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ApplicationsRepository } from '../ports/applications-repository.port';

// Indicadores de la bandeja (CA-08.1): se calculan siempre con los datos del backend.
export class GetApplicationMetricsUseCase {
  constructor(private readonly repository: ApplicationsRepository) {}

  execute(actor: ActorContext, now: Date = new Date()) {
    return this.repository.metrics(actor, now);
  }
}