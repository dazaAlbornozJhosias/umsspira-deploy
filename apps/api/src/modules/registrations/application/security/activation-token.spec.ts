import { issueActivationToken, matchesBinding, parseActivationToken } from './activation-token';
import type { RegistrationSecurity } from '../ports/registration-security.port';

const id = '0b0f6b0e-6a43-4c53-9a0e-2f8f7d6c9a11';
const security: RegistrationSecurity = {
  token: () => 'token',
  code: () => '123456',
  hash: (purpose, value) => purpose + '#' + value,
  seal: () => 'sealed',
};

describe('pase de activación', () => {
  it('se emite, se lee y coincide con el hash con el que se firmó', () => {
    const token = issueActivationToken(security, id, 'hash-vigente', 1_000);
    const parsed = parseActivationToken(token);
    expect(parsed).not.toBeNull();
    expect(parsed!.applicationId).toBe(id);
    expect(parsed!.expiresAt).toBe(1_000 + 600_000);
    expect(matchesBinding(security, parsed!, 'hash-vigente')).toBe(true);
  });

  it('deja de coincidir cuando el hash vigente cambia o se borra', () => {
    const parsed = parseActivationToken(issueActivationToken(security, id, 'hash-vigente'))!;
    expect(matchesBinding(security, parsed, 'otro-hash')).toBe(false);
  });

  it('rechaza una firma alterada', () => {
    const token = issueActivationToken(security, id, 'hash-vigente');
    const parsed = parseActivationToken(token + 'x')!;
    expect(matchesBinding(security, parsed, 'hash-vigente')).toBe(false);
  });

  it.each([['', 'vacío'], ['sinpunto', 'sin separador'], ['.firma', 'sin contenido']])(
    'no interpreta un pase mal formado (%s)',
    (token) => {
      expect(parseActivationToken(token)).toBeNull();
    },
  );

  it('no interpreta un pase cuya expiración no es un número', () => {
    const bad = Buffer.from(id + '.abc').toString('base64url') + '.firma';
    expect(parseActivationToken(bad)).toBeNull();
  });
});