import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';
import type { ExperienceInput } from '../contracts/profile-inputs';

export class CreateExperienceUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(actor: ActorContext, input: ExperienceInput) {
    return this.repository.createExperience(profileScope(actor), input);
  }
}
