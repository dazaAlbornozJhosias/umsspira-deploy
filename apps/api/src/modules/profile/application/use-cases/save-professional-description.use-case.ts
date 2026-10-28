import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { profileScope } from '../services/profile-scope';

export class SaveProfessionalDescriptionUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  // Solo el titulado de la sesión: el dueño nunca llega en el cuerpo ni en la ruta
  async execute(actor: ActorContext, text: string) {
    return this.repository.saveDescription(profileScope(actor), text);
  }
}
