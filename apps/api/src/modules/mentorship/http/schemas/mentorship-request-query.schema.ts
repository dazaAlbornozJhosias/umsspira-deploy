import { z } from 'zod';
import { MENTORSHIP_REQUEST_STATUSES } from '../../domain/entities/mentorship-request';

export const mentorshipRequestQuerySchema = z.object({
  estado: z.enum(MENTORSHIP_REQUEST_STATUSES).default('PENDIENTE'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(20),
});

export type MentorshipRequestQueryParams = z.output<typeof mentorshipRequestQuerySchema>;
