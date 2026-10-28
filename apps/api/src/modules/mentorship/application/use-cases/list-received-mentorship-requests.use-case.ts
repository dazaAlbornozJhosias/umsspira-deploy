import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorshipRequestQuery } from '../contracts/mentorship-request-query';
import type { MentorshipRequestRepository } from '../ports/mentorship-request-repository.port';

export class ListReceivedMentorshipRequestsUseCase {
  constructor(private readonly repository: MentorshipRequestRepository) {}

  async execute(actor: ActorContext, query: MentorshipRequestQuery) {
    this.assertMentor(actor);
    return this.repository.listReceived(actor.id, query);
  }

  private assertMentor(actor: ActorContext) {
    if (actor.role !== 'titulado') {
      throw new BusinessRuleError(
        'forbidden',
        'MENTOR_NO_HABILITADO',
        'Se requiere una participación activa como mentor',
      );
    }
  }
}
