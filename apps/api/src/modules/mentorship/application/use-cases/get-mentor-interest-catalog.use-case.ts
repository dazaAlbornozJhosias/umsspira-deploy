import type { MentorCatalogRepository } from '../ports/mentor-catalog-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class GetMentorInterestCatalogUseCase {
  constructor(private readonly repository: MentorCatalogRepository) {}
  async execute(actor: ActorContext) {
    return this.repository.interestCatalog(actor.id);
  }
}
