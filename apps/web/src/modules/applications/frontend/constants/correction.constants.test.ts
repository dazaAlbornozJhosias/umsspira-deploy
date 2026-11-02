import { isValidCorrectionTokenFormat } from './correction.constants';

describe('isValidCorrectionTokenFormat', () => {
  it('acepta tokens alfanuméricos con guiones y guiones bajos', () => {
    expect(isValidCorrectionTokenFormat('validToken123')).toBe(true);
    expect(isValidCorrectionTokenFormat('abc-def_123')).toBe(true);
    expect(isValidCorrectionTokenFormat('a'.repeat(128))).toBe(true);
  });

  it('rechaza tokens vacíos, nulos o con caracteres especiales inválidos', () => {
    expect(isValidCorrectionTokenFormat('')).toBe(false);
    expect(isValidCorrectionTokenFormat(null as unknown as string)).toBe(false);
    expect(isValidCorrectionTokenFormat(undefined as unknown as string)).toBe(false);
    expect(isValidCorrectionTokenFormat('token@invalido')).toBe(false);
    expect(isValidCorrectionTokenFormat('token con espacios')).toBe(false);
    expect(isValidCorrectionTokenFormat('a'.repeat(129))).toBe(false);
  });
});
