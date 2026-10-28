import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ProfileScope } from '../contracts/profile-inputs';

export function profileScope(actor: ActorContext): ProfileScope {
  if (!actor.scopes.graduateId) {
    throw new BusinessRuleError(
      'forbidden',
      'GRADUATE_PROFILE_REQUIRED',
      'La cuenta no tiene un perfil de titulado asociado',
    );
  }
  return { graduateId: actor.scopes.graduateId, userId: actor.id };
}
