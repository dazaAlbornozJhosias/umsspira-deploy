import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorshipRequestRepository } from '../ports/mentorship-request-repository.port';

export class GetReceivedMentorshipRequestUseCase {
  constructor(private readonly repository: MentorshipRequestRepository) {}

  async execute(actor: ActorContext, requestId: string) {
    if (actor.role !== 'titulado') {
      throw new BusinessRuleError(
        'forbidden',
        'MENTOR_NO_HABILITADO',
        'Se requiere una participación activa como mentor',
      );
    }
    return this.repository.getReceived(actor.id, requestId);
  }
}
