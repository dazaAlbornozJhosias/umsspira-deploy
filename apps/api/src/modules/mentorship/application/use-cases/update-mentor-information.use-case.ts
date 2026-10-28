import type { MentorRepository } from '../ports/mentor-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorInformationInput } from '../contracts/mentor-inputs';

export class UpdateMentorInformationUseCase {
  constructor(private readonly repository: MentorRepository) {}
  async execute(actor: ActorContext, input: MentorInformationInput) {
    return this.repository.updateInformation(actor.id, input);
  }
}
