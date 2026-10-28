import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { RegistrationDraft } from '../entities/registration';

export const DRAFT_SECONDS = 7200;
export const CODE_SECONDS = 300;
export const RESEND_SECONDS = 60;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function assertOpenDraft(
  draft: RegistrationDraft | null,
): asserts draft is RegistrationDraft {
  if (!draft || draft.expiresAt.getTime() <= Date.now() || draft.applicationId) {
    throw new BusinessRuleError(
      'expired',
      'REGISTRATION_EXPIRED',
      'El registro venció o ya fue enviado',
    );
  }
}

export function assertVerifiedDraft(
  draft: RegistrationDraft | null,
): asserts draft is RegistrationDraft {
  assertOpenDraft(draft);
  if (!draft.verified) {
    throw new BusinessRuleError(
      'forbidden',
      'EMAIL_NOT_VERIFIED',
      'Debes verificar tu correo primero',
    );
  }
}
