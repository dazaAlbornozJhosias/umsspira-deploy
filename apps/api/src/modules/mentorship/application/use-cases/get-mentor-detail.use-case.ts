import type { MentorRepository } from '../ports/mentor-repository.port';
import type { MentorProfile } from '../../domain/entities/mentor';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { buildUpcomingSlots, upcomingWindow } from '../../domain/policies/mentor-schedule.policy';

export class GetMentorDetailUseCase {
  constructor(
    private readonly repository: MentorRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async execute(mentorId: string): Promise<MentorProfile> {
    const window = upcomingWindow(this.now());
    const from = window.days[0].date;
    const to = window.days[window.days.length - 1].date;
    const detail = await this.repository.detail(mentorId, from, to);
    if (!detail) {
      throw new BusinessRuleError(
        'missing',
        'MENTOR_NOT_FOUND',
        'Este perfil no está disponible',
      );
    }
    const slots = detail.canRequest
      ? buildUpcomingSlots(detail.schedules, detail.bookings, window)
      : [];
    return { ...detail, week: { from, to, slots } };
  }
}
