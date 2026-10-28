import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';
import type { EducationInput } from '../contracts/profile-inputs';

export class CreateEducationUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(actor: ActorContext, input: EducationInput) {
    return this.repository.createEducation(profileScope(actor), input);
  }
}
