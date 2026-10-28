import type { MentorCatalogRepository } from '../ports/mentor-catalog-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorInterestsInput } from '../contracts/mentor-inputs';
import { assertDistinctInterests } from '../../domain/policies/mentor.policy';

export class AddMentorInterestsUseCase {
  constructor(private readonly repository: MentorCatalogRepository) {}
  async execute(actor: ActorContext, input: MentorInterestsInput) {
    assertDistinctInterests(input.ids);
    return this.repository.addInterests(actor.id, input.ids);
  }
}
