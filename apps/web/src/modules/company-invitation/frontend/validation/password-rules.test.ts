import { PASSWORD_RULES, validatePasswordForm } from './password-rules';

const passesRule = (id: string, value: string) =>
  PASSWORD_RULES.find((rule) => rule.id === id)?.test(value);

describe('password-rules', () => {
  it('evalúa cada requisito por separado', () => {
    expect(passesRule('length', 'Abc12345')).toBe(true);
    expect(passesRule('length', 'Abc1234')).toBe(false);
    expect(passesRule('uppercase', 'abc12345')).toBe(false);
    expect(passesRule('lowercase', 'ABC12345')).toBe(false);
    expect(passesRule('number', 'Abcdefgh')).toBe(false);
  });

  it('exige ambos campos', () => {
    expect(validatePasswordForm('', '')).toEqual({
      password: 'Este campo es obligatorio.',
      confirmPassword: 'Este campo es obligatorio.',
    });
  });

  it('rechaza contraseñas que no coinciden', () => {
    expect(validatePasswordForm('Abc12345', 'Abc12346').confirmPassword).toBe(
      'Las contraseñas no coinciden.',
    );
  });

  it('acepta una contraseña válida', () => {
    expect(validatePasswordForm('Abc12345', 'Abc12345')).toEqual({});
  });
});