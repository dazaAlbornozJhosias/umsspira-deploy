import type { MentorAvailabilityRepository } from '../ports/mentor-availability-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorAvailabilityInput } from '../contracts/mentor-inputs';

export class SetMentorAvailabilityUseCase {
  constructor(private readonly repository: MentorAvailabilityRepository) {}
  async execute(actor: ActorContext, input: MentorAvailabilityInput) {
    return this.repository.update(actor.id, input.availabilityStatus);
  }
}
