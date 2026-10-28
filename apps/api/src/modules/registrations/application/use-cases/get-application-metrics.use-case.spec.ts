import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ApplicationsRepository } from '../ports/applications-repository.port';
import { GetApplicationMetricsUseCase } from './get-application-metrics.use-case';

const actor = { id: 'actor-1', scopes: { careerIds: ['carrera-1'] } } as unknown as ActorContext;

const metrics = {
  receivedToday: 5,
  pending: 12,
  urgent: 3,
  resolvedToday: 2,
  generatedAt: '2026-10-21T15:00:00.000Z',
  timeZone: 'America/La_Paz',
};

describe('GetApplicationMetricsUseCase', () => {
  it('pide los indicadores al repositorio con el actor y el instante actual (CA-08.1)', async () => {
    const repository = { metrics: jest.fn().mockResolvedValue(metrics) };
    const useCase = new GetApplicationMetricsUseCase(repository as unknown as ApplicationsRepository);
    const now = new Date('2026-10-21T15:00:00Z');

    await expect(useCase.execute(actor, now)).resolves.toEqual(metrics);
    expect(repository.metrics).toHaveBeenCalledWith(actor, now);
  });

  it('usa la fecha actual cuando no se indica otra', async () => {
    const repository = { metrics: jest.fn().mockResolvedValue(metrics) };
    const useCase = new GetApplicationMetricsUseCase(repository as unknown as ApplicationsRepository);

    await useCase.execute(actor);

    expect(repository.metrics).toHaveBeenCalledWith(actor, expect.any(Date));
  });
});