import { ReviewApplicationUseCase } from './review-application.use-case';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { CorrectionTokenService } from '../services/correction-token.service';

const id = '0b0f6b0e-6a43-4c53-9a0e-2f8f7d6c9a11';
const actor = { id: 'admin-1' } as unknown as ActorContext;
const security: RegistrationSecurity = {
  token: () => 'token',
  code: () => '123456',
  hash: (purpose, value) => purpose + '#' + value,
  seal: (value) => JSON.stringify(value),
};

function build(overrides?: { reviewError?: Error }) {
  const find = jest.fn().mockResolvedValue({
    email: 'maria@example.com',
    fullName: 'María Pérez',
    code: 'TIT-2026-ABC123',
  });
  const review = overrides?.reviewError
    ? jest.fn().mockRejectedValue(overrides.reviewError)
    : jest.fn().mockResolvedValue({ notificationStatus: 'QUEUED' });
  const repository = { find, review } as unknown as ApplicationsRepository;
  const tokenService = {
    issueLink: jest.fn().mockResolvedValue('https://example.com/register/correction/sample-token'),
    revoke: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CorrectionTokenService>;

  return {
    review,
    tokenService,
    useCase: new ReviewApplicationUseCase(repository, security, tokenService),
  };
}

describe('ReviewApplicationUseCase', () => {
  it('encola el correo de aprobación con el código y no emite enlace de corrección', async () => {
    const { useCase, review, tokenService } = build();
    await useCase.execute(actor, id, { decision: 'APROBADA' });
    const [, , , hash, sealed, mail] = review.mock.calls[0];
    expect(tokenService.issueLink).not.toHaveBeenCalled();
    expect(hash).toBe('activation#' + id + ':123456');
    expect(sealed).toContain('123456');
    expect(sealed).not.toContain('TIT-');
    expect(mail).toEqual({
      type: 'aprobacion',
      to: 'maria@example.com',
      subject: '[UMSSPIRA] ¡Tu solicitud de registro ha sido aprobada!',
    });
  });

  it('encola el correo de rechazo sin código ni enlace de corrección', async () => {
    const { useCase, review, tokenService } = build();
    await useCase.execute(actor, id, {
      decision: 'RECHAZADA',
      category: 'Documento ilegible',
      note: 'Sube una copia más nítida del certificado',
    });
    const [, , , hash, sealed, mail] = review.mock.calls[0];
    expect(tokenService.issueLink).not.toHaveBeenCalled();
    expect(hash).toBeNull();
    expect(sealed).toContain('Documento ilegible');
    expect(sealed).not.toContain('TIT-');
    expect(mail.type).toBe('rechazo');
    expect(mail.to).toBe('maria@example.com');
  });

  it('al marcar OBSERVADA emite enlace y lo pasa al correo de resolución', async () => {
    const { useCase, review, tokenService } = build();
    await useCase.execute(actor, id, {
      decision: 'OBSERVADA',
      category: 'Documento ilegible',
      note: 'Sube una copia más nítida del certificado',
    });
    expect(tokenService.issueLink).toHaveBeenCalledWith(id);
    const [, , , hash, sealed, mail] = review.mock.calls[0];
    expect(hash).toBeNull();
    expect(sealed).toContain('https://example.com/register/correction/sample-token');
    expect(mail.type).toBe('observacion');
    expect(mail.to).toBe('maria@example.com');
  });

  it('si el repositorio falla al marcar OBSERVADA revoca el token y relanza el error', async () => {
    const error = new Error('Database transaction failed');
    const { useCase, tokenService } = build({ reviewError: error });
    await expect(
      useCase.execute(actor, id, {
        decision: 'OBSERVADA',
        category: 'Documento ilegible',
        note: 'Sube una copia más nítida del certificado',
      }),
    ).rejects.toThrow('Database transaction failed');
    expect(tokenService.issueLink).toHaveBeenCalledWith(id);
    expect(tokenService.revoke).toHaveBeenCalledWith(id);
  });
});
