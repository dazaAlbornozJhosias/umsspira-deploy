import { z } from 'zod';

const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:mm');

export const createMentorshipRequestSchema = z
  .strictObject({
    mentorId: z.uuid().transform((value) => value.toLowerCase()),
    fecha: z.iso.date(),
    horaInicio: timeSchema,
    horaFin: timeSchema,
    mensaje: z
      .string()
      .trim()
      .max(300)
      .refine(
        (value) => !/<\/?\s*[a-z][^>]*>?/i.test(value),
        'El mensaje no puede contener etiquetas HTML',
      )
      .transform((value) => (value.length ? value : undefined))
      .optional(),
  })
  .superRefine(({ horaInicio, horaFin }, context) => {
    const minutes = (time: string) => {
      const [hours, value] = time.split(':').map(Number);
      return hours * 60 + value;
    };
    if (minutes(horaFin) - minutes(horaInicio) !== 60) {
      context.addIssue({
        code: 'custom',
        path: ['horaFin'],
        message: 'La solicitud debe corresponder a un bloque de una hora',
      });
    }
  });

export type CreateMentorshipRequestBody = z.output<typeof createMentorshipRequestSchema>;
