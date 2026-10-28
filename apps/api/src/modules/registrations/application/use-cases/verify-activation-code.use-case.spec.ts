import { VerifyActivationCodeUseCase } from './verify-activation-code.use-case';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';

const id = '0b0f6b0e-6a43-4c53-9a0e-2f8f7d6c9a11';
const security: RegistrationSecurity = {
  token: () => 'token',
  code: () => '123456',
  hash: (purpose, value) => purpose + '#' + value,
  seal: () => 'sealed',
};

function build(result: unknown) {
  const verifyActivation = jest.fn().mockResolvedValue(result);
  const repository = { verifyActivation } as unknown as ApplicationsRepository;
  return { verifyActivation, useCase: new VerifyActivationCodeUseCase(repository, security) };
}

describe('VerifyActivationCodeUseCase', () => {
  it('entrega un pase firmado y consulta con el hash del código', async () => {
    const { useCase, verifyActivation } = build({ result: 'verified', binding: 'hash-vigente' });
    const output = await useCase.execute(id, '123456');
    expect(verifyActivation).toHaveBeenCalledWith(id, 'activation#' + id + ':123456');
    const [payload, ...rest] = output.activationToken.split('.');
    const signature = rest.join('.');
    expect(Buffer.from(payload, 'base64url').toString()).toContain(id);
    expect(signature).toContain('activation-token#');
    expect(signature).toContain('hash-vigente');
    expect(output.expiresInSeconds).toBe(600);
  });

  it.each([
    ['expired', 'ACTIVATION_EXPIRED'],
    ['locked', 'ACTIVATION_ATTEMPTS_EXCEEDED'],
    ['invalid', 'INVALID_ACTIVATION'],
  ])('traduce el resultado %s sin emitir pase', async (result, code) => {
    const { useCase } = build({ result });
    await expect(useCase.execute(id, '123456')).rejects.toMatchObject({ code });
  });
});