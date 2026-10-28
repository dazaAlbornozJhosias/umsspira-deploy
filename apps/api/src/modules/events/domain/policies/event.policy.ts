import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { Event, InactiveEventStatus } from '../entities/event';

export function assertDraft(event: Event): void {
  if (event.status !== 'BORRADOR') {
    throw new BusinessRuleError(
      'conflict',
      'EVENT_NOT_DRAFT',
      'El evento ya no está en estado BORRADOR',
    );
  }
}

export function validateEventDates(start: Date, end: Date): void {
  if (
    [start, end].some(
      (date) =>
        Number.isNaN(date.getTime()) ||
        date.getUTCFullYear() < 1900 ||
        date.getUTCFullYear() > 2100,
    )
  ) {
    throw new BusinessRuleError(
      'invalid',
      'INVALID_EVENT_DATES',
      'Las fechas deben estar entre los años 1900 y 2100',
    );
  }
  if (end <= start) {
    throw new BusinessRuleError(
      'invalid',
      'INVALID_EVENT_DATES',
      'La fecha de fin debe ser posterior al inicio',
    );
  }
}
/** "Finalizado" = PUBLICADO con fecha/hora de fin ya transcurrida (no existe enum FINALIZADO). */
export function isFinished(event: Event, now: Date): boolean {
  return event.status === 'PUBLICADO' && event.endDate <= now;
}

export function inactiveStatus(event: Event, now: Date): InactiveEventStatus | null {
  if (event.status === 'CANCELADO') {
    return 'CANCELADO';
  }
  return isFinished(event, now) ? 'FINALIZADO' : null;
}

export function assertRetirable(event: Event, now: Date): void {
  if (inactiveStatus(event, now) === null) {
    throw new BusinessRuleError(
      'conflict',
      'EVENT_NOT_RETIRABLE',
      `No se puede retirar este evento. Cancélalo primero o espera a que finalice. El estado ${event.status} no permite retiro.`,
    );
  }
}
