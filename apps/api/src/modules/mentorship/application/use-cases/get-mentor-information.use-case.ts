import type { MentorRepository } from '../ports/mentor-repository.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export class GetMentorInformationUseCase {
  constructor(private readonly repository: MentorRepository) {}
  async execute(actor: ActorContext) {
    return this.repository.own(actor.id);
  }
}
