import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ApplicationsRepository } from '../ports/applications-repository.port';

export class GetApplicationDocumentUseCase {
  constructor(private readonly repository: ApplicationsRepository) {}

  execute(actor: ActorContext, id: string) {
    return this.repository.document(actor, id);
  }
}
