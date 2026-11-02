import { z } from 'zod';
import type { CreateEventInput, EventInput } from '../../application/contracts/event-inputs';

export const eventIdSchema = z.uuid();
export const registrationIdSchema = z.uuid();
export const COVER_PATH = '/api/v1/events/covers/';
const coverReferenceSchema = z
  .string()
  .max(2048)
  .refine(
    (value) =>
      value.startsWith(COVER_PATH) && z.uuid().safeParse(value.slice(COVER_PATH.length)).success,
    'Utiliza la referencia de una portada cargada por esta API',
  );
const dateSchema = z.iso.datetime({ offset: true }).refine((value) => {
  const year = new Date(value).getUTCFullYear();
  return year >= 1900 && year <= 2100;
}, 'El año debe estar entre 1900 y 2100');
const eventFields = {
  title: z.string().trim().min(1).max(45).regex(/\p{L}/u, 'El título debe contener una letra'),
  description: z.string().trim().max(20000).optional(),
  startDate: dateSchema,
  endDate: dateSchema,
  maxCapacity: z.number().int().min(1).max(10000),
  location: z.string().trim().max(100).optional(),
  imageUrl: coverReferenceSchema.nullable().optional(),
};
const baseEventSchema = z.strictObject(eventFields).superRefine((value, context) => {
  if (new Date(value.endDate) <= new Date(value.startDate)) {
    context.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'La fecha de fin debe ser posterior al inicio',
    });
  }
});
function toEventInput(value: z.infer<typeof baseEventSchema>): EventInput {
  const { imageUrl, ...input } = value;
  return {
    ...input,
    ...(imageUrl === undefined
      ? {}
      : { coverId: imageUrl === null ? null : imageUrl.slice(COVER_PATH.length) }),
  };
}
export const updateEventSchema = baseEventSchema.transform(toEventInput);
export const createEventSchema = baseEventSchema
  .safeExtend({
    status: z.enum(['BORRADOR', 'PUBLICADO']).default('BORRADOR'),
  })
  .transform((value): CreateEventInput => ({ ...toEventInput(value), status: value.status }));
