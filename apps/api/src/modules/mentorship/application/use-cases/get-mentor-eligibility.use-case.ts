import type { MentorRepository } from '../ports/mentor-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class GetMentorEligibilityUseCase {
  constructor(private readonly repository: MentorRepository) {}
  async execute(actor: ActorContext) {
    return { eligible: await this.repository.eligible(actor.id) };
  }
}
