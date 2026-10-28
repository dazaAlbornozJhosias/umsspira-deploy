import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';
import type { ProfileSection } from '../../domain/entities/profile-record';

export class DeleteProfileRecordUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(actor: ActorContext, section: ProfileSection, id: string) {
    return this.repository.remove(profileScope(actor), section, id);
  }
}
