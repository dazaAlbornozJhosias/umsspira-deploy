import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export function presentUser(actor: ActorContext) {
  return {
    id: actor.id,
    email: actor.email,
    name: actor.name,
    role: actor.role,
    permissions: [...actor.permissions],
    scopes: actor.scopes,
  };
}
