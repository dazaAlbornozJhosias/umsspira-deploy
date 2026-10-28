import {
  formatEventCardSchedule,
  formatEventDateTime,
  formatEventSchedule,
  getEventMonthKey,
} from './event-date-time';

describe('formato temporal de eventos en Bolivia', () => {
  it.each([
    ['evento diurno', '2026-11-03T14:30:00.000Z', '03 nov 2026, 10:30'],
    ['evento cerca de medianoche', '2026-11-06T03:59:00.000Z', '05 nov 2026, 23:59'],
  ])('mantiene la hora local para %s', (_caseName, value, expected) => {
    expect(formatEventDateTime(value)).toBe(expected);
  });

  it('muestra el rango compacto cuando inicia y termina el mismo día', () => {
    expect(formatEventCardSchedule(
      '2026-11-03T14:30:00.000Z',
      '2026-11-03T15:45:00.000Z',
    )).toBe('03 NOV 2026 · 10:30–11:45');
  });

  it('incluye ambas fechas en eventos de varios días y cruces de medianoche', () => {
    const startDate = '2026-11-04T03:59:00.000Z';
    const endDate = '2026-11-04T04:02:00.000Z';

    expect(formatEventCardSchedule(startDate, endDate)).toBe(
      '03 NOV 2026 · 23:59 / 04 NOV 2026 · 00:02',
    );
    expect(formatEventSchedule(startDate, endDate)).toContain('03 nov 2026');
    expect(formatEventSchedule(startDate, endDate)).toContain('04 nov 2026');
  });

  it('conserva fecha, hora y mes tras serializar el timestamp', () => {
    const serialized = JSON.parse(JSON.stringify({
      date: '2026-11-01T03:59:00.000Z',
    })) as { date: string };

    expect(formatEventDateTime(serialized.date)).toContain('31 oct 2026');
    expect(formatEventDateTime(serialized.date)).toContain('23:59');
    expect(getEventMonthKey(serialized.date)).toBe('2026-10');
  });
});
