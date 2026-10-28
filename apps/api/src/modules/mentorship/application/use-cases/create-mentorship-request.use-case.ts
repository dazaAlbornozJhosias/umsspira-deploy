import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { CreateMentorshipRequestInput } from '../contracts/create-mentorship-request.input';
import type { MentorshipRequestRepository } from '../ports/mentorship-request-repository.port';

export class CreateMentorshipRequestUseCase {
  constructor(
    private readonly repository: MentorshipRequestRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext, input: CreateMentorshipRequestInput) {
    if (actor.role !== 'titulado') {
      throw new BusinessRuleError(
        'forbidden',
        'MENTORSHIP_REQUEST_FORBIDDEN',
        'Solo un titulado aprobado puede solicitar una mentoría',
      );
    }
    const now = this.now();
    const start = new Date(`${input.date}T${input.startTime}:00.000Z`);
    if (start.getTime() <= now.getTime()) {
      throw new BusinessRuleError(
        'invalid',
        'MENTORSHIP_REQUEST_PAST',
        'Selecciona un horario futuro',
      );
    }
    return this.repository.create(actor.id, input, now);
  }
}
