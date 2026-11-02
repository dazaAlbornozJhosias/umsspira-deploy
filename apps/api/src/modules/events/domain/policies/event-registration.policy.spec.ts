import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { assertRegistrationCancellable } from './event-registration.policy';

const now = new Date('2026-11-01T12:00:00Z');
const future = new Date(now.getTime() + 1);

describe('assertRegistrationCancellable', () => {
  it('permite una inscripción CONFIRMADA hasta antes del fin sin modificar sus datos', () => {
    const registration = Object.freeze({ status: 'CONFIRMADA', endDate: future });
    expect(assertRegistrationCancellable(registration, now)).toBeUndefined();
    expect(registration).toEqual({ status: 'CONFIRMADA', endDate: future });
    expect(future.getTime()).toBe(now.getTime() + 1);
  });

  it.each(['CANCELADA', 'PENDIENTE', null])('rechaza el estado %s', (status) => {
    const registration = Object.freeze({ status, endDate: future });
    const validate = () => assertRegistrationCancellable(registration, now);
    expect(validate).toThrow(BusinessRuleError);
    expect(validate).toThrow(
      expect.objectContaining({
        reason: 'conflict',
        code: 'EVENT_REGISTRATION_NOT_CONFIRMED',
      }),
    );
    expect(registration).toEqual({ status, endDate: future });
  });

  it.each([
    ['pasado', new Date(now.getTime() - 1)],
    ['instante exacto', new Date(now)],
    ['sin fecha', null],
    ['fecha inválida', new Date('invalid')],
  ])('rechaza un evento con fin %s', (_label, endDate) => {
    const registration = Object.freeze({ status: 'CONFIRMADA', endDate });
    const validate = () => assertRegistrationCancellable(registration, now);
    expect(validate).toThrow(BusinessRuleError);
    expect(validate).toThrow(
      expect.objectContaining({
        reason: 'conflict',
        code: 'EVENT_REGISTRATION_NOT_CANCELLABLE',
      }),
    );
    expect(registration).toEqual({ status: 'CONFIRMADA', endDate });
  });
});
