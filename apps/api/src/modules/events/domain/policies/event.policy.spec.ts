import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { Event } from '../entities/event';
import { assertRetirable, inactiveStatus } from './event.policy';

const now = new Date('2026-11-01T12:00:00Z');
const past = new Date('2026-10-01T12:00:00Z');
const future = new Date('2026-12-01T12:00:00Z');

function eventWith(overrides: Partial<Event>): Event {
  return {
    id: '6f1d8a52-0f7c-4a45-a9d6-1b2c3d4e5f60',
    ownerId: '7a2e9b63-1a8d-4b56-b0e7-2c3d4e5f6071',
    title: 'Feria',
    description: null,
    startDate: new Date('2026-10-01T10:00:00Z'),
    endDate: past,
    maxCapacity: 50,
    location: null,
    coverId: null,
    status: 'PUBLICADO',
    creatorName: null,
    createdAt: new Date('2026-09-01T10:00:00Z'),
    ...overrides,
  };
}

describe('inactiveStatus', () => {
  it('marca CANCELADO a un evento cancelado, aunque no haya terminado', () => {
    expect(inactiveStatus(eventWith({ status: 'CANCELADO', endDate: future }), now)).toBe(
      'CANCELADO',
    );
  });

  it('marca FINALIZADO a un evento cuya fecha de fin ya pasó', () => {
    expect(inactiveStatus(eventWith({}), now)).toBe('FINALIZADO');
  });

  it('considera finalizado un evento que termina exactamente ahora', () => {
    expect(inactiveStatus(eventWith({ endDate: now }), now)).toBe('FINALIZADO');
  });

  it('no marca como inactivo a un evento vigente', () => {
    expect(inactiveStatus(eventWith({ endDate: future }), now)).toBeNull();
  });

  it('no marca como inactivo a un BORRADOR cuya fecha de fin ya pasó', () => {
    expect(inactiveStatus(eventWith({ status: 'BORRADOR' }), now)).toBeNull();
  });
});

describe('assertRetirable', () => {
  it('permite retirar un evento CANCELADO', () => {
    expect(() => assertRetirable(eventWith({ status: 'CANCELADO' }), now)).not.toThrow();
  });

  it('permite retirar un evento finalizado', () => {
    expect(() => assertRetirable(eventWith({}), now)).not.toThrow();
  });

  it('rechaza un evento PUBLICADO que aún no finaliza, con el mensaje del mockup', () => {
    const event = eventWith({ endDate: future });
    expect(() => assertRetirable(event, now)).toThrow(BusinessRuleError);
    expect(() => assertRetirable(event, now)).toThrow(
      'Cancélalo primero o espera a que finalice. El estado PUBLICADO no permite retiro.',
    );
  });

  it('rechaza un BORRADOR vigente', () => {
    expect(() => assertRetirable(eventWith({ status: 'BORRADOR', endDate: future }), now)).toThrow(
      BusinessRuleError,
    );
  });
});
