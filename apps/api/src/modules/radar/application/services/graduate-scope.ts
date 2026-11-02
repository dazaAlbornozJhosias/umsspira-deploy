import { AccessError } from '../../../../shared/security/errors/access-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

/**
 * El radar siempre pertenece al titulado autenticado. Las rutas de empresa o
 * administración no tienen scope de titulado y reciben 403.
 */
export function requireGraduateScope(actor: ActorContext): string {
  if (!actor.scopes.graduateId) {
    throw new AccessError('FORBIDDEN');
  }

  return actor.scopes.graduateId;
}
