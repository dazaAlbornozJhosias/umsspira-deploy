import type { CreateMentorshipRequestInput } from '../contracts/create-mentorship-request.input';
import type { MentorshipRequestQuery } from '../contracts/mentorship-request-query';
import type {
  MentorSlotDay,
  MentorshipRequest,
  MentorshipRequestPage,
  MentorshipRequestStatus,
} from '../../domain/entities/mentorship-request';

export const MENTORSHIP_REQUEST_REPOSITORY = Symbol('MENTORSHIP_REQUEST_REPOSITORY');

export interface MentorshipRequestRepository {
  slots(mentorId: string, now: Date, days: number): Promise<MentorSlotDay[]>;
  create(
    userId: string,
    input: CreateMentorshipRequestInput,
    now: Date,
  ): Promise<MentorshipRequest>;
  listReceived(userId: string, query: MentorshipRequestQuery): Promise<MentorshipRequestPage>;
  getReceived(userId: string, requestId: string): Promise<MentorshipRequest>;
  respond(
    userId: string,
    requestId: string,
    status: Extract<MentorshipRequestStatus, 'ACEPTADO' | 'RECHAZADO'>,
    now: Date,
  ): Promise<MentorshipRequest>;
}
