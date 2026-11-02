import { z } from 'zod';

export const submitSurveySchema = z
  .object({
    id_encuesta: z.string().uuid().optional(),
    condicion_laboral: z.boolean(),

    cargo: z.string().trim().min(1).max(100).optional(),
    empresa: z.string().trim().min(1).max(100).optional(),
    area: z.string().trim().min(1).max(100).optional(),

    modalidad: z.string().trim().min(1).optional(),

    salario_mensual: z.string().trim().min(1).max(30).optional(),

    tiempo_insercion: z.string().trim().min(1).max(40).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.condicion_laboral) {
      const requiredFields = [
        'cargo',
        'empresa',
        'area',
        'modalidad',
        'salario_mensual',
        'tiempo_insercion',
      ] as const;

      for (const field of requiredFields) {
        if (!data[field]) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: 'Este campo es obligatorio',
          });
        }
      }
    } else {
      const jobFields = [
        'cargo',
        'empresa',
        'area',
        'modalidad',
        'salario_mensual',
        'tiempo_insercion',
      ] as const;

      for (const field of jobFields) {
        if (data[field] !== undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: 'No corresponde si no trabaja',
          });
        }
      }
    }
  });

export type SubmitSurveyDto =
  z.infer<typeof submitSurveySchema>;
