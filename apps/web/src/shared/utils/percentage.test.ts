import { clampPercentage, formatPercentage } from './percentage';

describe('percentage utils', () => {
  describe('clampPercentage', () => {
    it('redondea valores decimales al entero más cercano', () => {
      expect(clampPercentage(82.5)).toBe(83);
      expect(clampPercentage(71.25)).toBe(71);
      expect(clampPercentage(38.49)).toBe(38);
    });

    it('limita (clamp) valores menores a 0 a exactamente 0', () => {
      expect(clampPercentage(-5)).toBe(0);
      expect(clampPercentage(-100)).toBe(0);
    });

    it('limita (clamp) valores mayores a 100 a exactamente 100', () => {
      expect(clampPercentage(105)).toBe(100);
      expect(clampPercentage(999)).toBe(100);
    });

    it('mantiene enteros dentro del rango 0-100 intactos', () => {
      expect(clampPercentage(0)).toBe(0);
      expect(clampPercentage(50)).toBe(50);
      expect(clampPercentage(100)).toBe(100);
    });

    it('maneja valores no válidos (null, undefined, NaN, Infinity) devolviendo 0', () => {
      expect(clampPercentage(null)).toBe(0);
      expect(clampPercentage(undefined)).toBe(0);
      expect(clampPercentage(NaN)).toBe(0);
      expect(clampPercentage(Infinity)).toBe(0);
      expect(clampPercentage(-Infinity)).toBe(0);
    });
  });

  describe('formatPercentage', () => {
    it('formatea el porcentaje redondeado con el símbolo %', () => {
      expect(formatPercentage(82.5)).toBe('83%');
      expect(formatPercentage(71.25)).toBe('71%');
      expect(formatPercentage(-10)).toBe('0%');
      expect(formatPercentage(120)).toBe('100%');
      expect(formatPercentage(null)).toBe('0%');
    });
  });
});
