export interface MentorSlotDay {
  date: string;
  slots: { startTime: string; endTime: string }[];
}

export const MENTORSHIP_REQUEST_STATUSES = [
  'PENDIENTE',
  'ACEPTADO',
  'RECHAZADO',
  'CANCELADO',
] as const;

export type MentorshipRequestStatus = (typeof MENTORSHIP_REQUEST_STATUSES)[number];

export interface MentorshipRequest {
  id: string;
  mentorId: string;
  requesterId: string;
  requesterName: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  message: string | null;
  status: MentorshipRequestStatus;
  createdAt: Date | null;
  respondedAt: Date | null;
}

export interface MentorshipRequestPage {
  items: MentorshipRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}