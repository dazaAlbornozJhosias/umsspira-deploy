import { z } from 'zod';

export const companyIdSchema = z.uuid();

export const updateCompanyProfileSchema = z
  .object({
    razonSocial: z.string().trim().min(1).max(100).optional(),
    eslogan: z.string().trim().max(200).optional(),
    descripcionLarga: z.string().trim().min(1).max(2000).optional(),
    tamanoEmpresa: z.string().trim().max(45).optional(),
    sitioWeb: z.string().trim().max(45).pipe(z.httpUrl()).optional(),
    correo: z.string().trim().toLowerCase().max(254).pipe(z.email()).optional(),
    telefono: z
      .string()
      .trim()
      .regex(/^\+?[0-9 -]{7,20}$/, 'Teléfono inválido')
      .refine(
        (value) => value.replace(/\D/g, '').length >= 7,
        'El teléfono requiere al menos siete dígitos',
      )
      .optional(),
    direccion: z.string().trim().min(1).max(255).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export type UpdateCompanyProfileBody = z.output<typeof updateCompanyProfileSchema>;
