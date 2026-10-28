import type { MentorCatalogRepository } from '../ports/mentor-catalog-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class GetMyMentorInterestsUseCase {
  constructor(private readonly repository: MentorCatalogRepository) {}
  async execute(actor: ActorContext) {
    return this.repository.interests(actor.id);
  }
}
