import type { MentorRepository } from '../ports/mentor-repository.port';
import type { MentorDetail } from '../../domain/entities/mentor';
import { GetMentorDetailUseCase } from './get-mentor-detail.use-case';

const friday = () => new Date('2026-10-23T14:30:00Z');

function detail(overrides: Partial<MentorDetail> = {}): MentorDetail {
  return {
    mentor: {
      id: 'mentor-1',
      graduateId: 'titulado-1',
      graduateName: 'María Pérez',
      careerId: null,
      active: true,
      description: null,
      experience: null,
      relevantInformation: null,
      photoUrl: null,
      experienceYears: null,
      createdAt: null,
      updatedAt: null,
    },
    areas: [],
    interests: [],
    availability: 'DISPONIBLE',
    canRequest: true,
    schedules: [{ weekday: 2, start: '18:00', end: '20:00' }],
    bookings: [{ date: '2026-10-27', start: '19:00', end: '20:00' }],
    position: null,
    company: null,
    ...overrides,
  };
}

describe('GetMentorDetailUseCase', () => {
  const repository = { detail: jest.fn() };
  const useCase = new GetMentorDetailUseCase(
    repository as unknown as MentorRepository,
    friday,
  );

  beforeEach(() => repository.detail.mockReset());

  it('consulta los próximos 7 días y arma los horarios libres', async () => {
    repository.detail.mockResolvedValue(detail());
    const profile = await useCase.execute('mentor-1');
    expect(repository.detail).toHaveBeenCalledWith('mentor-1', '2026-10-23', '2026-10-29');
    expect(profile.week).toEqual({
      from: '2026-10-23',
      to: '2026-10-29',
      slots: [{ date: '2026-10-27', weekday: 2, times: ['18:00'] }],
    });
  });

  it('no ofrece horarios si el mentor no puede recibir solicitudes', async () => {
    repository.detail.mockResolvedValue(detail({ availability: 'EN_PAUSA', canRequest: false }));
    await expect(useCase.execute('mentor-1')).resolves.toMatchObject({
      week: { slots: [] },
    });
  });

  it('responde MENTOR_NOT_FOUND si el perfil no está disponible', async () => {
    repository.detail.mockResolvedValue(null);
    await expect(useCase.execute('mentor-1')).rejects.toMatchObject({
      code: 'MENTOR_NOT_FOUND',
    });
  });
});
