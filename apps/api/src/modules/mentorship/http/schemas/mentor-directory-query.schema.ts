import { z } from 'zod';

export const mentorDirectoryQuerySchema = z.strictObject({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type MentorDirectoryQueryInput = z.infer<typeof mentorDirectoryQuerySchema>;
