import { ReviewApplicationUseCase } from './review-application.use-case';

const actor = {} as never;
const detail = { fullName: 'Ana Perez', email: 'ana@umss.edu.bo' };

function setup(issueLink: jest.Mock) {
  const repository = {
    find: jest.fn().mockResolvedValue(detail),
    review: jest.fn().mockResolvedValue({ ok: true }),
  };
  const security = {
    code: jest.fn().mockReturnValue('123456'),
    hash: jest.fn().mockReturnValue('hash'),
    seal: jest.fn().mockImplementation((value) => JSON.stringify(value)),
  };
  const useCase = new ReviewApplicationUseCase(repository as never, security as never, {
    issueLink,
  });
  return { repository, security, useCase };
}

const observed = { decision: 'OBSERVADA', category: 'Documento ilegible', note: 'Reescanear' } as never;

describe('ReviewApplicationUseCase - observada', () => {
  it('genera el enlace de correccion y lo incluye en el correo', async () => {
    const issueLink = jest.fn().mockResolvedValue('https://web.test/applications/correct/tok');
    const { security, repository, useCase } = setup(issueLink);

    await useCase.execute(actor, 'app-1', observed);

    expect(issueLink).toHaveBeenCalledWith('app-1');
    const sealed = security.seal.mock.calls[0][0];
    expect(sealed.text).toContain('https://web.test/applications/correct/tok');
    expect(sealed.html).toContain('Corregir mi solicitud');
    expect(repository.review.mock.calls[0][5]).toMatchObject({ type: 'observacion' });
  });

  it('guarda el dictamen aunque falle la generacion del enlace', async () => {
    const issueLink = jest.fn().mockRejectedValue(new Error('db caida'));
    const { repository, useCase } = setup(issueLink);

    await expect(useCase.execute(actor, 'app-1', observed)).resolves.toEqual({ ok: true });
    expect(repository.review).toHaveBeenCalledTimes(1);
  });

  it('no genera enlace cuando se aprueba', async () => {
    const issueLink = jest.fn();
    const { useCase } = setup(issueLink);

    await useCase.execute(actor, 'app-1', { decision: 'APROBADA' } as never);

    expect(issueLink).not.toHaveBeenCalled();
  });
});