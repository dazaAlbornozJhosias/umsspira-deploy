import type { CompanyAccountRole, RegisterCompanyPayload } from '@umsspira/shared-types';

// Mismas reglas que la API (US-1.4).
export const TAX_ID_PATTERN = /^\d{7,15}$/;
export const MAX_INITIAL_ACCOUNTS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AccountDraft {
  email: string;
  role: CompanyAccountRole;
}

export interface RegisterCompanyFormState {
  companyName: string;
  taxId: string;
  accounts: AccountDraft[];
}

export interface RegisterCompanyErrors {
  companyName?: string;
  taxId?: string;
  accounts?: string;
  accountEmails: Record<number, string>;
}

export function validateRegisterCompany(form: RegisterCompanyFormState): RegisterCompanyErrors {
  const errors: RegisterCompanyErrors = { accountEmails: {} };

  if (form.companyName.trim().length < 2) {
    errors.companyName = 'Ingresa la razón social';
  }
  if (!TAX_ID_PATTERN.test(form.taxId.trim())) {
    errors.taxId = 'El NIT debe tener entre 7 y 15 dígitos, sin letras ni guiones';
  }

  const seen = new Set<string>();
  form.accounts.forEach((account, index) => {
    const email = account.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      errors.accountEmails[index] = 'Correo no válido';
    } else if (seen.has(email)) {
      errors.accountEmails[index] = 'Este correo ya está en la lista';
    }
    seen.add(email);
  });

  if (form.accounts.length === 0) {
    errors.accounts = 'Agrega al menos una cuenta inicial';
  } else if (!form.accounts.some((account) => account.role === 'administrador')) {
    errors.accounts = 'Al menos una cuenta debe tener el rol administrador';
  }

  return errors;
}

export function hasErrors(errors: RegisterCompanyErrors): boolean {
  return Boolean(
    errors.companyName || errors.taxId || errors.accounts || Object.keys(errors.accountEmails).length > 0,
  );
}

export function toRegisterCompanyPayload(form: RegisterCompanyFormState): RegisterCompanyPayload {
  return {
    companyName: form.companyName.trim(),
    taxId: form.taxId.trim(),
    accounts: form.accounts.map((account) => ({
      email: account.email.trim().toLowerCase(),
      role: account.role,
    })),
  };
}