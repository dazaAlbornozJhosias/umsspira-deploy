import type { RegistryInvitation } from '../contracts/company-registry';
import type { CompanyInvitationRepository } from '../ports/company-invitation-repository.port';
import { ListCompanyRegistryUseCase } from './list-company-registry.use-case';

const now = new Date('2026-10-29T12:00:00Z');

function invitation(overrides: Partial<RegistryInvitation> = {}): RegistryInvitation {
  return {
    id: 'inv-1',
    email: 'admin@empresa.com',
    role: 'administrador',
    status: 'pendiente',
    createdAt: new Date('2026-10-27T12:00:00Z'),
    expiresAt: new Date('2026-11-03T12:00:00Z'),
    acceptedAt: null,
    ...overrides,
  };
}

function build(invitations: RegistryInvitation[]) {
  const listRegistry = jest.fn().mockResolvedValue({
    items: [{ id: 'empresa-1', name: 'TechSolutions', taxId: '1023456029', registeredAt: now, invitations }],
    total: 1,
  });
  const repository = { listRegistry } as unknown as CompanyInvitationRepository;
  return { useCase: new ListCompanyRegistryUseCase(repository, () => now), listRegistry };
}

describe('ListCompanyRegistryUseCase', () => {
  it('devuelve la página y pasa el filtro al repositorio', async () => {
    const { useCase, listRegistry } = build([invitation()]);
    const result = await useCase.execute({ search: 'tech', page: 2, pageSize: 5 });

    expect(listRegistry).toHaveBeenCalledWith({ search: 'tech', page: 2, pageSize: 5 });
    expect(result).toMatchObject({ total: 1, page: 2, pageSize: 5 });
  });

  it('marca como pendiente una empresa con invitaciones vigentes', async () => {
    const { useCase } = build([invitation()]);
    const [company] = (await useCase.execute({ page: 1, pageSize: 10 })).items;
    expect(company.status).toBe('pendiente');
  });

  it('calcula el vencimiento con la fecha de expiración', async () => {
    const { useCase } = build([invitation({ expiresAt: new Date('2026-10-28T12:00:00Z') })]);
    const [company] = (await useCase.execute({ page: 1, pageSize: 10 })).items;
    expect(company.invitations[0].status).toBe('vencida');
    expect(company.status).toBe('vencida');
  });

  it('marca como activa una empresa con alguna cuenta aceptada', async () => {
    const { useCase } = build([
      invitation({ status: 'aceptada', acceptedAt: now }),
      invitation({ id: 'inv-2', role: 'reclutador', expiresAt: new Date('2026-10-28T12:00:00Z') }),
    ]);
    const [company] = (await useCase.execute({ page: 1, pageSize: 10 })).items;
    expect(company.status).toBe('activa');
  });
});