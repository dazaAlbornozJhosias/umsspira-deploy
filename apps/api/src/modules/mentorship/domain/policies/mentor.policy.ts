import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { AvailabilityStatus, MentorSchedule } from '../entities/mentor';

export function assertDistinctInterests(ids: string[]): void {
  if (new Set(ids).size !== ids.length) {
    throw new BusinessRuleError(
      'conflict',
      'INTEREST_ALREADY_SELECTED',
      'No repitas un interés en la solicitud',
    );
  }
}

export function canReceiveMentorship(
  active: boolean,
  availability: AvailabilityStatus | null,
): boolean {
  return active && availability === 'DISPONIBLE';
}

export function isWithinSchedule(
  schedules: readonly MentorSchedule[],
  weekday: number,
  start: string,
  end: string,
): boolean {
  return (
    start < end &&
    schedules.some(
      (schedule) => schedule.weekday === weekday && schedule.start <= start && end <= schedule.end,
    )
  );
}
