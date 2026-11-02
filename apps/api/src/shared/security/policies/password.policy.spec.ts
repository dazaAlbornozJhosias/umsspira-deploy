import { meetsPasswordPolicy } from './password.policy';

describe('meetsPasswordPolicy', () => {
  it('acepta una contraseña de 8 caracteres con los cuatro tipos', () => {
    expect(meetsPasswordPolicy('Abcdef1!')).toBe(true);
  });

  it('acepta letras con tilde y la eñe', () => {
    expect(meetsPasswordPolicy('Contraseña1#')).toBe(true);
  });

  it.each([
    ['muy corta', 'Abc1!'],
    ['sin mayúscula', 'abcdef1!'],
    ['sin minúscula', 'ABCDEF1!'],
    ['sin número', 'Abcdefg!'],
    ['sin símbolo', 'Abcdefg1'],
    ['solo espacios como símbolo', 'Abcdef1 '],
    ['más de 128 caracteres', 'Aa1!' + 'x'.repeat(125)],
  ])('rechaza una contraseña %s', (_motivo, password) => {
    expect(meetsPasswordPolicy(password)).toBe(false);
  });
});