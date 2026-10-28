import type { MentorAvailabilityRepository } from '../ports/mentor-availability-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class GetMentorAvailabilityUseCase {
  constructor(private readonly repository: MentorAvailabilityRepository) {}
  async execute(actor: ActorContext) {
    return this.repository.own(actor.id);
  }
}
