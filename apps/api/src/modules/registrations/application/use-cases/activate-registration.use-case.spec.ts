import { ActivateRegistrationUseCase } from './activate-registration.use-case';
import { issueActivationToken } from '../security/activation-token';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';
import type { PasswordHasher } from '../../../auth/application/ports/password-hasher.port';

const id = '0b0f6b0e-6a43-4c53-9a0e-2f8f7d6c9a11';
const security: RegistrationSecurity = {
  token: () => 'token',
  code: () => '123456',
  hash: (purpose, value) => purpose + '#' + value,
  seal: () => 'sealed',
};
const passwords: PasswordHasher = {
  hash: async (password) => 'argon2:' + password,
  verify: async () => true,
  needsRehash: () => false,
};

function build(result: unknown = 'activated') {
  const activate = jest.fn().mockResolvedValue(result);
  const repository = { activate } as unknown as ApplicationsRepository;
  return { activate, useCase: new ActivateRegistrationUseCase(repository, security, passwords) };
}

describe('ActivateRegistrationUseCase', () => {
  it('crea la cuenta con el hash de la contraseña y comprueba el pase contra el hash vigente', async () => {
    const { useCase, activate } = build();
    const token = issueActivationToken(security, id, 'hash-vigente');
    await expect(useCase.execute(id, token, 'Abcdef1!')).resolves.toEqual({ activated: true });
    const [calledId, passwordHash, matches] = activate.mock.calls[0];
    expect(calledId).toBe(id);
    expect(passwordHash).toBe('argon2:Abcdef1!');
    expect(matches('hash-vigente')).toBe(true);
    expect(matches('hash-de-otra-solicitud')).toBe(false);
  });

  it.each([
    ['con formato inválido', 'no-es-un-pase'],
    ['de otra solicitud', issueActivationToken(security, '11111111-1111-4111-8111-111111111111', 'h')],
  ])('rechaza un pase %s sin consultar la base de datos', async (_motivo, token) => {
    const { useCase, activate } = build();
    await expect(useCase.execute(id, token, 'Abcdef1!')).rejects.toMatchObject({
      code: 'INVALID_ACTIVATION_TOKEN',
    });
    expect(activate).not.toHaveBeenCalled();
  });

  it('rechaza un pase vencido y pide validar el código otra vez', async () => {
    const { useCase, activate } = build();
    const token = issueActivationToken(security, id, 'h', Date.now() - 11 * 60 * 1000);
    await expect(useCase.execute(id, token, 'Abcdef1!')).rejects.toMatchObject({
      code: 'ACTIVATION_TOKEN_EXPIRED',
    });
    expect(activate).not.toHaveBeenCalled();
  });

  it.each([
    ['expired', 'ACTIVATION_EXPIRED'],
    ['locked', 'ACTIVATION_ATTEMPTS_EXCEEDED'],
    ['already', 'ACTIVATION_ALREADY_DONE'],
    ['account-exists', 'ACCOUNT_ALREADY_EXISTS'],
    ['invalid', 'INVALID_ACTIVATION'],
  ])('traduce el resultado %s', async (result, code) => {
    const { useCase } = build(result);
    const token = issueActivationToken(security, id, 'h');
    await expect(useCase.execute(id, token, 'Abcdef1!')).rejects.toMatchObject({ code });
  });
});