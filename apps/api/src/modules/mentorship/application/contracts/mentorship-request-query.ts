import type { MentorshipRequestStatus } from '../../domain/entities/mentorship-request';

export interface MentorshipRequestQuery {
  status: MentorshipRequestStatus;
  page: number;
  pageSize: number;
}
