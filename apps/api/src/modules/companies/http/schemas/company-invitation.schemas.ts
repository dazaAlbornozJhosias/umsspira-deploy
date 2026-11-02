import { z } from 'zod';
import { COMPANY_ROLES } from '../../domain/entities/company-invitation.entity';
import { MAX_INITIAL_ACCOUNTS } from '../../domain/policies/company-registration.policy';

// El formato exacto del token lo valida el caso de uso (responde INVITATION_TOKEN_INVALID).
export const invitationTokenSchema = z.string().max(128);

// HU-02 CA-09 a CA-20: mismas reglas que el frontend.
export const activateCompanyInvitationSchema = z
  .strictObject({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(128)
      .regex(/[A-Z]/, 'La contraseña debe tener una letra mayúscula')
      .regex(/[a-z]/, 'La contraseña debe tener una letra minúscula')
      .regex(/\d/, 'La contraseña debe tener un número'),
    confirmPassword: z.string(),
  })
  .refine((body) => body.password === body.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type ActivateCompanyInvitationBody = z.output<typeof activateCompanyInvitationSchema>;

// US-1.4: NIT boliviano, solo dígitos.
export const companyTaxIdSchema = z
  .string()
  .trim()
  .regex(/^\d{7,15}$/, 'El NIT debe tener entre 7 y 15 dígitos, sin letras ni guiones');

export const createCompanyInvitationSchema = z.strictObject({
  companyName: z.string().trim().min(2, 'Ingresa la razón social').max(100),
  taxId: companyTaxIdSchema,
  accounts: z
    .array(
      z.strictObject({
        email: z.string().trim().toLowerCase().max(254).pipe(z.email('Correo no válido')),
        role: z.enum(COMPANY_ROLES),
      }),
    )
    .min(1, 'Agrega al menos una cuenta inicial')
    .max(MAX_INITIAL_ACCOUNTS),
});

export type CreateCompanyInvitationBody = z.output<typeof createCompanyInvitationSchema>;
export const invitationIdSchema = z.uuid();

export const companyRegistryQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type CompanyRegistryQueryInput = z.output<typeof companyRegistryQuerySchema>;

export const inviteCompanyMemberSchema = z.strictObject({
  nombre: z.string().trim().min(2, 'Ingresa un nombre válido').max(120),
  correo: z.string().trim().toLowerCase().max(254).pipe(z.email('Correo no válido')),
  rol: z.enum(['Administrador', 'Reclutador']),
});
