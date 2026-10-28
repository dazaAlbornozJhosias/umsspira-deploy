import { buildUpcomingSlots, upcomingWindow } from './mentor-schedule.policy';

// 2026-10-23 es viernes; 14:30 UTC son las 10:30 en Bolivia (UTC-4).
const friday = new Date('2026-10-23T14:30:00Z');

describe('upcomingWindow', () => {
  it('devuelve los próximos 7 días en hora de Bolivia con lunes = 1 y domingo = 7', () => {
    const window = upcomingWindow(friday);
    expect(window.currentTime).toBe('10:30');
    expect(window.days).toEqual([
      { date: '2026-10-23', weekday: 5 },
      { date: '2026-10-24', weekday: 6 },
      { date: '2026-10-25', weekday: 7 },
      { date: '2026-10-26', weekday: 1 },
      { date: '2026-10-27', weekday: 2 },
      { date: '2026-10-28', weekday: 3 },
      { date: '2026-10-29', weekday: 4 },
    ]);
  });

  it('usa la fecha local aunque en UTC ya sea el día siguiente', () => {
    const window = upcomingWindow(new Date('2026-10-24T02:00:00Z'));
    expect(window.days[0]).toEqual({ date: '2026-10-23', weekday: 5 });
    expect(window.currentTime).toBe('22:00');
  });
});

describe('buildUpcomingSlots', () => {
  const window = upcomingWindow(friday);

  it('divide cada rango en sesiones de 1 hora y omite los días sin horarios', () => {
    expect(
      buildUpcomingSlots([{ weekday: 2, start: '18:00', end: '20:00' }], [], window),
    ).toEqual([{ date: '2026-10-27', weekday: 2, times: ['18:00', '19:00'] }]);
  });

  it('descarta las horas de hoy que ya pasaron', () => {
    expect(
      buildUpcomingSlots([{ weekday: 5, start: '09:00', end: '13:00' }], [], window),
    ).toEqual([{ date: '2026-10-23', weekday: 5, times: ['11:00', '12:00'] }]);
  });

  it('quita los bloques que se solapan con solicitudes pendientes o aceptadas', () => {
    expect(
      buildUpcomingSlots(
        [{ weekday: 1, start: '08:00', end: '12:00' }],
        [
          { date: '2026-10-26', start: '09:00', end: '10:00' },
          { date: '2026-10-26', start: '10:30', end: '11:30' },
          { date: '2026-10-27', start: '08:00', end: '09:00' },
        ],
        window,
      ),
    ).toEqual([{ date: '2026-10-26', weekday: 1, times: ['08:00'] }]);
  });

  it('no ofrece sesiones incompletas y une rangos solapados sin duplicar horas', () => {
    expect(
      buildUpcomingSlots(
        [
          { weekday: 7, start: '08:30', end: '10:00' },
          { weekday: 7, start: '08:30', end: '09:30' },
          { weekday: 7, start: '15:00', end: '15:45' },
        ],
        [],
        window,
      ),
    ).toEqual([{ date: '2026-10-25', weekday: 7, times: ['08:30'] }]);
  });
});
