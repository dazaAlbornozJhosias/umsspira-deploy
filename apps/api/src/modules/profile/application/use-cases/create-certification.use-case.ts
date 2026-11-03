import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';
import type { CertificationCreationInput } from '../contracts/profile-inputs';

export class CreateCertificationUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(actor: ActorContext, input: CertificationCreationInput) {
    return this.repository.createCertification(profileScope(actor), input);
  }
}
