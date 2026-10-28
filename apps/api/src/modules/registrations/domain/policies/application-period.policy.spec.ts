import {
  addDays,
  boliviaDate,
  resolveApplicationPeriod,
  startOfBoliviaDay,
  todayRange,
  urgentCutoff,
} from './application-period.policy';

// 21/10/2026 11:00 en Bolivia.
const NOW = new Date('2026-10-21T15:00:00Z');

describe('application-period.policy', () => {
  describe('boliviaDate', () => {
    it('usa la fecha de Bolivia y no la de UTC', () => {
      // 22:00 del 21/10 en Bolivia ya es 22/10 en UTC.
      expect(boliviaDate(new Date('2026-10-22T02:00:00Z'))).toBe('2026-10-21');
    });

    it('cambia de día exactamente a las 00:00 de Bolivia (04:00 UTC)', () => {
      expect(boliviaDate(new Date('2026-10-21T03:59:59Z'))).toBe('2026-10-20');
      expect(boliviaDate(new Date('2026-10-21T04:00:00Z'))).toBe('2026-10-21');
    });
  });

  describe('addDays', () => {
    it.each([
      ['2026-12-31', 1, '2027-01-01'],
      ['2026-03-01', -1, '2026-02-28'],
      ['2028-03-01', -1, '2028-02-29'],
      ['2026-10-21', -14, '2026-10-07'],
    ])('%s %i día(s) da %s', (date, days, expected) => {
      expect(addDays(date, days)).toBe(expected);
    });
  });

  it('el inicio de un día en Bolivia es a las 04:00 UTC', () => {
    expect(startOfBoliviaDay('2026-10-21').toISOString()).toBe('2026-10-21T04:00:00.000Z');
  });

  describe('todayRange (CA-08.1)', () => {
    it('cubre desde las 00:00 de hoy hasta las 00:00 de mañana en Bolivia', () => {
      const range = todayRange(NOW);

      expect(range.gte.toISOString()).toBe('2026-10-21T04:00:00.000Z');
      expect(range.lt.toISOString()).toBe('2026-10-22T04:00:00.000Z');
    });

    it('a las 22:00 en Bolivia sigue siendo el mismo día', () => {
      const range = todayRange(new Date('2026-10-22T02:00:00Z'));

      expect(range.gte.toISOString()).toBe('2026-10-21T04:00:00.000Z');
      expect(range.lt.toISOString()).toBe('2026-10-22T04:00:00.000Z');
    });
  });

  it('el corte de urgencia es 48 horas antes del instante actual', () => {
    expect(urgentCutoff(NOW).toISOString()).toBe('2026-10-19T15:00:00.000Z');
  });

  describe('resolveApplicationPeriod (CA-08.4)', () => {
    it('«Últimos 15 días» cuenta 15 días de calendario incluyendo hoy', () => {
      const range = resolveApplicationPeriod({ period: 'last15' }, NOW);

      expect(range.gte?.toISOString()).toBe('2026-10-07T04:00:00.000Z');
      expect(range.lt?.toISOString()).toBe('2026-10-22T04:00:00.000Z');
    });

    it('«Últimos 30 días» cuenta 30 días de calendario incluyendo hoy', () => {
      const range = resolveApplicationPeriod({ period: 'last30' }, NOW);

      expect(range.gte?.toISOString()).toBe('2026-09-22T04:00:00.000Z');
      expect(range.lt?.toISOString()).toBe('2026-10-22T04:00:00.000Z');
    });

    it('un semestre cubre sus fechas completas, con el último día incluido', () => {
      const first = resolveApplicationPeriod({ period: 'semester1', year: 2026 }, NOW);
      const second = resolveApplicationPeriod({ period: 'semester2', year: 2026 }, NOW);

      expect(first.gte?.toISOString()).toBe('2026-01-01T04:00:00.000Z');
      expect(first.lt?.toISOString()).toBe('2026-07-01T04:00:00.000Z');
      expect(second.gte?.toISOString()).toBe('2026-07-01T04:00:00.000Z');
      expect(second.lt?.toISOString()).toBe('2027-01-01T04:00:00.000Z');
    });

    it('un semestre sin año usa el año actual de Bolivia', () => {
      const range = resolveApplicationPeriod({ period: 'semester1' }, NOW);

      expect(range.gte?.toISOString()).toBe('2026-01-01T04:00:00.000Z');
    });

    it('«Desde/Hasta» incluye el día final completo', () => {
      const range = resolveApplicationPeriod({ period: 'custom', from: '2026-10-01', to: '2026-10-15' }, NOW);

      expect(range.gte?.toISOString()).toBe('2026-10-01T04:00:00.000Z');
      expect(range.lt?.toISOString()).toBe('2026-10-16T04:00:00.000Z');
    });

    it('acepta solo «Desde» o solo «Hasta»', () => {
      expect(resolveApplicationPeriod({ period: 'custom', from: '2026-10-01' }, NOW)).toEqual({
        gte: new Date('2026-10-01T04:00:00.000Z'),
      });
      expect(resolveApplicationPeriod({ period: 'custom', to: '2026-10-15' }, NOW)).toEqual({
        lt: new Date('2026-10-16T04:00:00.000Z'),
      });
    });
  });
});