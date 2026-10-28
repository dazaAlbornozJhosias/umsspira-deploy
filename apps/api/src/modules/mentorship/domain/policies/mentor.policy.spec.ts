import { canReceiveMentorship, isWithinSchedule } from './mentor.policy';

describe('Políticas del mentor', () => {
  const schedules = [
    { weekday: 2, start: '18:00', end: '20:00' },
    { weekday: 4, start: '09:00', end: '10:00' },
  ];

  it('solo recibe solicitudes un mentor activo y disponible', () => {
    expect(canReceiveMentorship(true, 'DISPONIBLE')).toBe(true);
    expect(canReceiveMentorship(true, 'EN_PAUSA')).toBe(false);
    expect(canReceiveMentorship(true, null)).toBe(false);
    expect(canReceiveMentorship(false, 'DISPONIBLE')).toBe(false);
  });

  it('acepta un bloque dentro del horario del mentor', () => {
    expect(isWithinSchedule(schedules, 2, '18:00', '19:00')).toBe(true);
    expect(isWithinSchedule(schedules, 2, '19:00', '20:00')).toBe(true);
    expect(isWithinSchedule(schedules, 4, '09:00', '10:00')).toBe(true);
  });

  it('rechaza bloques fuera del horario, de otro día o invertidos', () => {
    expect(isWithinSchedule(schedules, 2, '19:30', '20:30')).toBe(false);
    expect(isWithinSchedule(schedules, 3, '18:00', '19:00')).toBe(false);
    expect(isWithinSchedule(schedules, 2, '19:00', '18:00')).toBe(false);
    expect(isWithinSchedule([], 2, '18:00', '19:00')).toBe(false);
  });
});
