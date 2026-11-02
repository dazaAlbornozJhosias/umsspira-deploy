import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import {
  MAX_INITIAL_ACCOUNTS,
  type InitialAccountsProblem,
} from '../policies/company-registration.policy';

export class InvitationTokenInvalidError extends BusinessRuleError {
  constructor() {
    super('invalid', 'INVITATION_TOKEN_INVALID', 'El enlace de invitación no es válido');
  }
}

export class InvitationNotFoundError extends BusinessRuleError {
  constructor() {
    super('missing', 'INVITATION_NOT_FOUND', 'La invitación no existe o no puede utilizarse');
  }
}

export class InvitationExpiredError extends BusinessRuleError {
  constructor() {
    super('expired', 'INVITATION_EXPIRED', 'La invitación venció');
  }
}

export class InvitationAlreadyUsedError extends BusinessRuleError {
  constructor() {
    super('conflict', 'INVITATION_ALREADY_USED', 'La invitación ya fue utilizada');
  }
}

export class InvitationEmailInUseError extends BusinessRuleError {
  constructor(email?: string) {
    super(
      'conflict',
      'INVITATION_EMAIL_IN_USE',
      email
        ? `El correo ${email} ya tiene una cuenta registrada`
        : 'El correo de la invitación ya tiene una cuenta registrada',
    );
  }
}

export class CompanyTaxIdInUseError extends BusinessRuleError {
  constructor() {
    super('conflict', 'COMPANY_TAX_ID_IN_USE', 'Ya existe una empresa registrada con ese NIT');
  }
}

const ACCOUNT_PROBLEM_MESSAGES: Record<InitialAccountsProblem, string> = {
  empty: 'Agrega al menos una cuenta inicial',
  too_many: `Puedes habilitar hasta ${MAX_INITIAL_ACCOUNTS} cuentas iniciales`,
  no_admin: 'Al menos una cuenta debe tener el rol administrador',
  duplicated_email: 'Hay correos repetidos entre las cuentas',
};

export class CompanyAccountsInvalidError extends BusinessRuleError {
  constructor(problem: InitialAccountsProblem) {
    super('invalid', 'COMPANY_ACCOUNTS_INVALID', ACCOUNT_PROBLEM_MESSAGES[problem]);
  }
}