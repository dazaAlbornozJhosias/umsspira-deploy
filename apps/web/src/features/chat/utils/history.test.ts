import {
  dayKey,
  formatDayLabel,
  shouldShowDaySeparator,
} from './history';

describe('history utils (HU-08)', () => {
  it('dayKey devuelve «sin-fecha» para valores vacíos o inválidos', () => {
    expect(dayKey(null)).toBe('sin-fecha');
    expect(dayKey(undefined)).toBe('sin-fecha');
    expect(dayKey('no es una fecha')).toBe('sin-fecha');
  });

  it('dayKey agrupa por día local', () => {
    const a = new Date(2025, 9, 16, 9, 12).toISOString();
    const b = new Date(2025, 9, 16, 23, 50).toISOString();
    const c = new Date(2025, 9, 17, 0, 5).toISOString();
    expect(dayKey(a)).toBe(dayKey(b));
    expect(dayKey(b)).not.toBe(dayKey(c));
  });

  it('formatDayLabel incluye día y año, y es vacío sin fecha', () => {
    const label = formatDayLabel(new Date(2025, 9, 16, 9, 12).toISOString());
    expect(label).toContain('16');
    expect(label).toContain('2025');
    expect(formatDayLabel(null)).toBe('');
  });

  it('shouldShowDaySeparator marca el primer mensaje y los cambios de día', () => {
    const d1 = new Date(2025, 9, 16, 9, 12).toISOString();
    const d1b = new Date(2025, 9, 16, 9, 15).toISOString();
    const d2 = new Date(2025, 9, 17, 8, 0).toISOString();

    expect(shouldShowDaySeparator(null, d1, true)).toBe(true);
    expect(shouldShowDaySeparator(d1, d1b, false)).toBe(false);
    expect(shouldShowDaySeparator(d1b, d2, false)).toBe(true);
  });

  it('no muestra separador si el mensaje no tiene fecha', () => {
    expect(shouldShowDaySeparator(null, null, true)).toBe(false);
  });
});