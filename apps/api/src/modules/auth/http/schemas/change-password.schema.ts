import { z } from 'zod';

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(15, 'La contraseña debe tener al menos 15 caracteres').max(128),
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ['newPassword'],
    message: 'La nueva contraseña debe ser diferente',
  });

export type PasswordBody = z.output<typeof passwordSchema>;
