import { z } from 'zod';
import {
  meetsPasswordPolicy,
  PASSWORD_MAX_LENGTH,
  PASSWORD_POLICY_MESSAGE,
} from '../../../../shared/security/policies/password.policy';

// Política de contraseña de HU-06 (CA-06.3), compartida con la activación y el cambio de contraseña.
export const recoveryPasswordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH)
  .refine(meetsPasswordPolicy, PASSWORD_POLICY_MESSAGE);

// Mismo tratamiento del correo que el inicio de sesión.
const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

// El formato del token no se valida aquí: un enlace mal formado responde igual que uno inexistente.
const tokenSchema = z.string().trim().min(1).max(256);

export const recoveryRequestSchema = z.object({ email: emailSchema }).strict();
export const recoveryLinkSchema = z.object({ token: tokenSchema }).strict();
export const recoveryResetSchema = z
  .object({ token: tokenSchema, password: recoveryPasswordSchema })
  .strict();

export type RecoveryRequestBody = z.output<typeof recoveryRequestSchema>;
export type RecoveryLinkBody = z.output<typeof recoveryLinkSchema>;
export type RecoveryResetBody = z.output<typeof recoveryResetSchema>;