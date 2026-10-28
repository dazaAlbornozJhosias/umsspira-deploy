import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { MentorshipRequestRepository } from '../ports/mentorship-request-repository.port';

export const SLOT_HORIZON_DAYS = 60;

export class GetMentorSlotsUseCase {
  constructor(
    private readonly repository: MentorshipRequestRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext, mentorId: string) {
    if (actor.role !== 'titulado') {
      throw new BusinessRuleError(
        'forbidden',
        'MENTORSHIP_REQUEST_FORBIDDEN',
        'Solo un titulado aprobado puede solicitar una mentoría',
      );
    }
    return this.repository.slots(mentorId, this.now(), SLOT_HORIZON_DAYS);
  }
}
