import type { MentorRepository } from '../ports/mentor-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ParticipationInput } from '../contracts/mentor-inputs';

export class SetMentorParticipationUseCase {
  constructor(private readonly repository: MentorRepository) {}
  async execute(actor: ActorContext, input: ParticipationInput) {
    return this.repository.participate(actor.id, input);
  }
}
