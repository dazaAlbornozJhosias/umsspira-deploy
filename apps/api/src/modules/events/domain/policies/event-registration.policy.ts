import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';

export function assertRegistrationCancellable(
  registration: { status: string | null; endDate: Date | null },
  now: Date,
): void {
  if (registration.status !== 'CONFIRMADA') {
    throw new BusinessRuleError(
      'conflict',
      'EVENT_REGISTRATION_NOT_CONFIRMED',
      'La inscripción debe estar CONFIRMADA para poder cancelarla',
    );
  }
  if (!registration.endDate || !(registration.endDate > now)) {
    throw new BusinessRuleError(
      'conflict',
      'EVENT_REGISTRATION_NOT_CANCELLABLE',
      'La inscripción solo puede cancelarse antes de la finalización del evento',
    );
  }
}
