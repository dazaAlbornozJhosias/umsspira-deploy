import type { MentorCatalogRepository } from '../ports/mentor-catalog-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorAreasInput } from '../contracts/mentor-inputs';

export class SetMentorAreasUseCase {
  constructor(private readonly repository: MentorCatalogRepository) {}
  async execute(actor: ActorContext, input: MentorAreasInput) {
    return this.repository.setAreas(actor.id, input.areaIds);
  }
}
