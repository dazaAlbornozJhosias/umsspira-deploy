import { z } from 'zod';
import { REPORT_STATUSES } from '../../domain/entities/graduate-report';

const fields = {
  careerId: z
    .uuid()
    .transform((value) => value.toLowerCase())
    .optional(),
  status: z.enum(REPORT_STATUSES).optional(),
  search: z
    .string()
    .max(100)
    .transform((value) => value.replace(/\s+/g, ' ').trim())
    .optional(),
};
export const reportFilterSchema = z.strictObject(fields);
export const reportMetricsSchema = z.strictObject({ careerId: fields.careerId });
export const graduateListSchema = z.strictObject({
  ...fields,
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
});
