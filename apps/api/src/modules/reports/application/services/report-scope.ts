import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';

export function reportScope(actor: ActorContext, careerId?: string): string[] {
  const allowed = actor.scopes.careerIds;
  if (!allowed.length || (careerId && !allowed.includes(careerId))) {
    throw new BusinessRuleError(
      'forbidden',
      'REPORT_CAREER_FORBIDDEN',
      'No tienes acceso a la carrera solicitada',
    );
  }
  return careerId ? [careerId] : [...allowed];
}
