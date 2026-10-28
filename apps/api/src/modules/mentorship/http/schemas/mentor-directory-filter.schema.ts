import { z } from 'zod';

const idList = z.preprocess(
  (value) => (typeof value === 'string' ? value.split(',') : value),
  z.array(z.uuid()).max(100).transform((ids) => [...new Set(ids.map((id) => id.toLowerCase()))]),
);

export const mentorDirectoryFilterSchema = z.strictObject({
  areaIds: idList.optional().default([]),
  interestIds: idList.optional().default([]),
});

export const mentorFilterOptionsSchema = z.strictObject({
  areaIds: idList.optional().default([]),
});

export type MentorDirectoryFilterQuery = z.infer<typeof mentorDirectoryFilterSchema>;
export type MentorFilterOptionsQuery = z.infer<typeof mentorFilterOptionsSchema>;
