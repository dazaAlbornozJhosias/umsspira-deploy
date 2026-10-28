import type { AvailabilityStatus, MentorAvailability } from '../../domain/entities/mentor';

export const MENTOR_AVAILABILITY_REPOSITORY = Symbol('MENTOR_AVAILABILITY_REPOSITORY');

export interface MentorAvailabilityRepository {
  own(userId: string): Promise<MentorAvailability>;
  update(userId: string, status: AvailabilityStatus): Promise<MentorAvailability>;
  canReceiveRequests(mentorId: string): Promise<boolean>;
}
