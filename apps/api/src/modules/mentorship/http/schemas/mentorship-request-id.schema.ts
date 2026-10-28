import { z } from 'zod';

export const mentorshipRequestIdSchema = z.uuid().transform((value) => value.toLowerCase());
