import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ApplicationQuery } from '../contracts/registration-inputs';
import type { ApplicationsRepository } from '../ports/applications-repository.port';

export class ListApplicationsUseCase {
  constructor(private readonly repository: ApplicationsRepository) {}

  execute(actor: ActorContext, query: ApplicationQuery) {
    return this.repository.list(actor, query);
  }
}
