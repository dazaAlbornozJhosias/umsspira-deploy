import { ReviewApplicationUseCase } from './review-application.use-case';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import type { RegistrationSecurity } from '../ports/registration-security.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

const id = '0b0f6b0e-6a43-4c53-9a0e-2f8f7d6c9a11';
const actor = { id: 'admin-1' } as unknown as ActorContext;
const security: RegistrationSecurity = {
  token: () => 'token',
  code: () => '123456',
  hash: (purpose, value) => purpose + '#' + value,
  seal: (value) => JSON.stringify(value),
};

function build() {
  const find = jest.fn().mockResolvedValue({
    email: 'maria@example.com',
    fullName: 'María Pérez',
    code: 'TIT-2026-ABC123',
  });
  const review = jest.fn().mockResolvedValue({ notificationStatus: 'QUEUED' });
  const repository = { find, review } as unknown as ApplicationsRepository;
  return { review, useCase: new ReviewApplicationUseCase(repository, security) };
}

describe('ReviewApplicationUseCase', () => {
  it('encola el correo de aprobación con el código y registra su seguimiento', async () => {
    const { useCase, review } = build();
    await useCase.execute(actor, id, { decision: 'APROBADA' });
    const [, , , hash, sealed, mail] = review.mock.calls[0];
    expect(hash).toBe('activation#' + id + ':123456');
    expect(sealed).toContain('123456');
    expect(sealed).not.toContain('TIT-');
    expect(mail).toEqual({
      type: 'aprobacion',
      to: 'maria@example.com',
      subject: 'Tu solicitud en UMSSPIRA fue aprobada',
    });
  });

  it.each([
    ['OBSERVADA', 'observacion'],
    ['RECHAZADA', 'rechazo'],
  ] as const)('encola el correo de %s sin código de activación', async (decision, type) => {
    const { useCase, review } = build();
    await useCase.execute(actor, id, {
      decision,
      category: 'Documento ilegible',
      note: 'Sube una copia más nítida del certificado',
    });
    const [, , , hash, sealed, mail] = review.mock.calls[0];
    expect(hash).toBeNull();
    expect(sealed).toContain('Documento ilegible');
    expect(sealed).not.toContain('TIT-');
    expect(mail.type).toBe(type);
    expect(mail.to).toBe('maria@example.com');
  });
});