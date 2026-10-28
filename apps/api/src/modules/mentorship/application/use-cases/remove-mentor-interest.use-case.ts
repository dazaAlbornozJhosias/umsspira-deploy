import type { MentorCatalogRepository } from '../ports/mentor-catalog-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class RemoveMentorInterestUseCase {
  constructor(private readonly repository: MentorCatalogRepository) {}
  async execute(actor: ActorContext, id: string) {
    await this.repository.removeInterest(actor.id, id);
    return { id, eliminado: true };
  }
}
