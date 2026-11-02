import { calculateVariation, formatVariation } from './affinity-variation';

describe('calculateVariation', () => {
  it('no devuelve variación en el primer cálculo', () => {
    expect(calculateVariation(82, null)).toBeNull();
    expect(calculateVariation(82, undefined)).toBeNull();
  });

  it('no devuelve variación cuando falta el valor actual', () => {
    expect(calculateVariation(null, 82)).toBeNull();
    expect(calculateVariation(undefined, 82)).toBeNull();
  });

  it('no devuelve variación cuando los porcentajes redondeados son iguales', () => {
    expect(calculateVariation(40, 40)).toBeNull();
    expect(calculateVariation(40.2, 40.4)).toBeNull();
  });

  it('resuelve el redondeo en el límite con los enteros mostrados', () => {
    expect(calculateVariation(49.6, 50.4)).toBeNull();
    expect(calculateVariation(49.4, 50.4)).toBe(-1);
    expect(calculateVariation(50.4, 49.4)).toBe(1);
  });

  it('calcula el delta con los porcentajes ya redondeados', () => {
    expect(calculateVariation(82.5, 75)).toBe(8);
    expect(calculateVariation(82.4, 75)).toBe(7);
    expect(calculateVariation(40.6, 40.4)).toBe(1);
  });

  it('devuelve deltas negativos cuando la afinidad baja', () => {
    expect(calculateVariation(38, 45)).toBe(-7);
    expect(calculateVariation(0, 1)).toBe(-1);
  });

  it('admite los extremos del rango 0-100', () => {
    expect(calculateVariation(100, 0)).toBe(100);
    expect(calculateVariation(0, 100)).toBe(-100);
  });

  it('limita los porcentajes fuera de rango antes de restar', () => {
    expect(calculateVariation(105, 100)).toBeNull();
    expect(calculateVariation(120, 0)).toBe(100);
    expect(calculateVariation(-5, 0)).toBeNull();
  });

  it('no devuelve variación con valores no finitos', () => {
    expect(calculateVariation(Number.NaN, 50)).toBeNull();
    expect(calculateVariation(50, Number.NaN)).toBeNull();
    expect(calculateVariation(Number.POSITIVE_INFINITY, 50)).toBeNull();
  });
});

describe('formatVariation', () => {
  it('agrega el signo positivo y un espacio antes del porcentaje', () => {
    expect(formatVariation(8)).toBe('+8 %');
    expect(formatVariation(1)).toBe('+1 %');
    expect(formatVariation(100)).toBe('+100 %');
  });

  it('usa el signo menos tipográfico en los negativos', () => {
    expect(formatVariation(-3)).toBe('\u22123 %');
    expect(formatVariation(-3)).not.toContain('-');
    expect(formatVariation(-1)).toBe('\u22121 %');
    expect(formatVariation(-100)).toBe('\u2212100 %');
  });

  it('no muestra signo cuando la variación es cero', () => {
    expect(formatVariation(0)).toBe('0 %');
  });

  it('redondea deltas con decimales y nunca muestra decimales', () => {
    expect(formatVariation(8.4)).toBe('+8 %');
    expect(formatVariation(-2.6)).toBe('\u22123 %');
  });
});
