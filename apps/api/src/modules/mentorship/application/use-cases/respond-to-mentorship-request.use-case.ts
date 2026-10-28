import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorshipRequestStatus } from '../../domain/entities/mentorship-request';
import type { MentorshipRequestRepository } from '../ports/mentorship-request-repository.port';

export class RespondToMentorshipRequestUseCase {
  constructor(
    private readonly repository: MentorshipRequestRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    actor: ActorContext,
    requestId: string,
    status: Extract<MentorshipRequestStatus, 'ACEPTADO' | 'RECHAZADO'>,
  ) {
    if (actor.role !== 'titulado') {
      throw new BusinessRuleError(
        'forbidden',
        'MENTOR_NO_HABILITADO',
        'Se requiere una participación activa como mentor',
      );
    }
    return this.repository.respond(actor.id, requestId, status, this.now());
  }
}
