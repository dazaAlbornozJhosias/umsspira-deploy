import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { RecoveryLinkState } from '../../domain/policies/password-recovery.policy';

export type FailedLinkState = Exclude<RecoveryLinkState, 'valid'> | 'invalid';

// Errores de enlace con códigos distintos para que la pantalla muestre el mensaje correcto (CA-12.5).
export function recoveryLinkFailure(state: FailedLinkState): BusinessRuleError {
  switch (state) {
    case 'expired':
      return new BusinessRuleError(
        'expired',
        'RECOVERY_LINK_EXPIRED',
        'El enlace venció. Solicita uno nuevo.',
      );
    case 'used':
      return new BusinessRuleError(
        'conflict',
        'RECOVERY_LINK_USED',
        'Este enlace ya se usó. Solicita uno nuevo si lo necesitas.',
      );
    case 'revoked':
      return new BusinessRuleError(
        'conflict',
        'RECOVERY_LINK_REPLACED',
        'Este enlace fue reemplazado por uno más reciente. Revisa tu correo.',
      );
    default:
      return new BusinessRuleError(
        'invalid',
        'RECOVERY_LINK_INVALID',
        'El enlace no es válido. Solicita uno nuevo.',
      );
  }
}