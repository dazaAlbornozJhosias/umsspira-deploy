import type { CompanyRole, InvitationStatus } from '../entities/company-invitation.entity';

// US-1.4: la UMSS registra la empresa con 1 a N cuentas iniciales.
export const MAX_INITIAL_ACCOUNTS = 10;

export interface InitialAccount {
  email: string;
  role: CompanyRole;
}

export type InitialAccountsProblem = 'empty' | 'too_many' | 'no_admin' | 'duplicated_email';

// Los correos deben llegar normalizados (trim + minúsculas).
export function checkInitialAccounts(accounts: readonly InitialAccount[]): InitialAccountsProblem | null {
  if (accounts.length === 0) {
    return 'empty';
  }
  if (accounts.length > MAX_INITIAL_ACCOUNTS) {
    return 'too_many';
  }
  if (!accounts.some((account) => account.role === 'administrador')) {
    return 'no_admin';
  }
  const emails = new Set(accounts.map((account) => account.email));
  if (emails.size !== accounts.length) {
    return 'duplicated_email';
  }
  return null;
}

// La base puede tener "pendiente" ya vencida: el estado real se calcula con expira_en.
export function effectiveInvitationStatus(
  invitation: { status: InvitationStatus; expiresAt: Date },
  now: Date,
): InvitationStatus {
  if (invitation.status === 'pendiente' && invitation.expiresAt.getTime() <= now.getTime()) {
    return 'vencida';
  }
  return invitation.status;
}

export type CompanyAccessStatus = 'activa' | 'pendiente' | 'vencida';

// Activa: alguna cuenta ya entró. Pendiente: hay invitaciones vigentes. Vencida: hay que reenviar.
export function companyAccessStatus(statuses: readonly InvitationStatus[]): CompanyAccessStatus {
  if (statuses.includes('aceptada')) {
    return 'activa';
  }
  if (statuses.includes('pendiente')) {
    return 'pendiente';
  }
  return 'vencida';
}