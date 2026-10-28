import type { Provider } from '@nestjs/common';
import {
  MENTOR_REPOSITORY,
  type MentorRepository,
} from '../../application/ports/mentor-repository.port';
import { PrismaMentorRepository } from '../repositories/prisma-mentor.repository';
import {
  MENTOR_CATALOG_REPOSITORY,
  type MentorCatalogRepository,
} from '../../application/ports/mentor-catalog-repository.port';
import { PrismaMentorCatalogRepository } from '../repositories/prisma-mentor-catalog.repository';
import {
  MENTOR_AVAILABILITY_REPOSITORY,
  type MentorAvailabilityRepository,
} from '../../application/ports/mentor-availability-repository.port';
import { PrismaMentorAvailabilityRepository } from '../repositories/prisma-mentor-availability.repository';
import {
  MENTORSHIP_REQUEST_REPOSITORY,
  type MentorshipRequestRepository,
} from '../../application/ports/mentorship-request-repository.port';
import { PrismaMentorshipRequestRepository } from '../repositories/prisma-mentorship-request.repository';
import { ListMentorProfilesUseCase } from '../../application/use-cases/list-mentor-profiles.use-case';
import { FilterMentorProfilesUseCase } from '../../application/use-cases/filter-mentor-profiles.use-case';
import { GetMentorFilterOptionsUseCase } from '../../application/use-cases/get-mentor-filter-options.use-case';
import { GetMentorDetailUseCase } from '../../application/use-cases/get-mentor-detail.use-case';
import { GetMentorEligibilityUseCase } from '../../application/use-cases/get-mentor-eligibility.use-case';
import { GetMyMentorProfileUseCase } from '../../application/use-cases/get-my-mentor-profile.use-case';
import { GetMentorInformationUseCase } from '../../application/use-cases/get-mentor-information.use-case';
import { UpdateMentorInformationUseCase } from '../../application/use-cases/update-mentor-information.use-case';
import { ClearMentorInformationUseCase } from '../../application/use-cases/clear-mentor-information.use-case';
import { SetMentorParticipationUseCase } from '../../application/use-cases/set-mentor-participation.use-case';
import { DeactivateMentorUseCase } from '../../application/use-cases/deactivate-mentor.use-case';
import { GetMentorAreasUseCase } from '../../application/use-cases/get-mentor-areas.use-case';
import { SetMentorAreasUseCase } from '../../application/use-cases/set-mentor-areas.use-case';
import { GetMentorInterestCatalogUseCase } from '../../application/use-cases/get-mentor-interest-catalog.use-case';
import { GetMyMentorInterestsUseCase } from '../../application/use-cases/get-my-mentor-interests.use-case';
import { AddMentorInterestsUseCase } from '../../application/use-cases/add-mentor-interests.use-case';
import { RemoveMentorInterestUseCase } from '../../application/use-cases/remove-mentor-interest.use-case';
import { GetMentorAvailabilityUseCase } from '../../application/use-cases/get-mentor-availability.use-case';
import { SetMentorAvailabilityUseCase } from '../../application/use-cases/set-mentor-availability.use-case';
import { CreateMentorshipRequestUseCase } from '../../application/use-cases/create-mentorship-request.use-case';
import { ListReceivedMentorshipRequestsUseCase } from '../../application/use-cases/list-received-mentorship-requests.use-case';
import { GetReceivedMentorshipRequestUseCase } from '../../application/use-cases/get-received-mentorship-request.use-case';
import { RespondToMentorshipRequestUseCase } from '../../application/use-cases/respond-to-mentorship-request.use-case';
import { GetMentorSlotsUseCase } from '../../application/use-cases/get-mentor-slots.use-case';

export const mentorshipProviders: Provider[] = [
  PrismaMentorRepository,
  { provide: MENTOR_REPOSITORY, useExisting: PrismaMentorRepository },
  PrismaMentorCatalogRepository,
  { provide: MENTOR_CATALOG_REPOSITORY, useExisting: PrismaMentorCatalogRepository },
  PrismaMentorAvailabilityRepository,
  { provide: MENTOR_AVAILABILITY_REPOSITORY, useExisting: PrismaMentorAvailabilityRepository },
  PrismaMentorshipRequestRepository,
  { provide: MENTORSHIP_REQUEST_REPOSITORY, useExisting: PrismaMentorshipRequestRepository },
  {
    provide: ListMentorProfilesUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new ListMentorProfilesUseCase(repository),
  },
  {
    provide: FilterMentorProfilesUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new FilterMentorProfilesUseCase(repository),
  },
  {
    provide: GetMentorFilterOptionsUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new GetMentorFilterOptionsUseCase(repository),
  },
  {
    provide: GetMentorDetailUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new GetMentorDetailUseCase(repository),
  },
  {
    provide: ListReceivedMentorshipRequestsUseCase,
    inject: [MENTORSHIP_REQUEST_REPOSITORY],
    useFactory: (repository: MentorshipRequestRepository) =>
      new ListReceivedMentorshipRequestsUseCase(repository),
  },
  {
    provide: GetReceivedMentorshipRequestUseCase,
    inject: [MENTORSHIP_REQUEST_REPOSITORY],
    useFactory: (repository: MentorshipRequestRepository) =>
      new GetReceivedMentorshipRequestUseCase(repository),
  },
  {
    provide: RespondToMentorshipRequestUseCase,
    inject: [MENTORSHIP_REQUEST_REPOSITORY],
    useFactory: (repository: MentorshipRequestRepository) =>
      new RespondToMentorshipRequestUseCase(repository),
  },
  {
    provide: GetMentorEligibilityUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new GetMentorEligibilityUseCase(repository),
  },
  {
    provide: GetMyMentorProfileUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new GetMyMentorProfileUseCase(repository),
  },
  {
    provide: GetMentorInformationUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new GetMentorInformationUseCase(repository),
  },
  {
    provide: UpdateMentorInformationUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new UpdateMentorInformationUseCase(repository),
  },
  {
    provide: ClearMentorInformationUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new ClearMentorInformationUseCase(repository),
  },
  {
    provide: SetMentorParticipationUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new SetMentorParticipationUseCase(repository),
  },
  {
    provide: DeactivateMentorUseCase,
    inject: [MENTOR_REPOSITORY],
    useFactory: (repository: MentorRepository) => new DeactivateMentorUseCase(repository),
  },
  {
    provide: GetMentorAreasUseCase,
    inject: [MENTOR_CATALOG_REPOSITORY],
    useFactory: (repository: MentorCatalogRepository) => new GetMentorAreasUseCase(repository),
  },
  {
    provide: SetMentorAreasUseCase,
    inject: [MENTOR_CATALOG_REPOSITORY],
    useFactory: (repository: MentorCatalogRepository) => new SetMentorAreasUseCase(repository),
  },
  {
    provide: GetMentorInterestCatalogUseCase,
    inject: [MENTOR_CATALOG_REPOSITORY],
    useFactory: (repository: MentorCatalogRepository) =>
      new GetMentorInterestCatalogUseCase(repository),
  },
  {
    provide: GetMyMentorInterestsUseCase,
    inject: [MENTOR_CATALOG_REPOSITORY],
    useFactory: (repository: MentorCatalogRepository) =>
      new GetMyMentorInterestsUseCase(repository),
  },
  {
    provide: AddMentorInterestsUseCase,
    inject: [MENTOR_CATALOG_REPOSITORY],
    useFactory: (repository: MentorCatalogRepository) => new AddMentorInterestsUseCase(repository),
  },
  {
    provide: RemoveMentorInterestUseCase,
    inject: [MENTOR_CATALOG_REPOSITORY],
    useFactory: (repository: MentorCatalogRepository) =>
      new RemoveMentorInterestUseCase(repository),
  },
  {
    provide: GetMentorAvailabilityUseCase,
    inject: [MENTOR_AVAILABILITY_REPOSITORY],
    useFactory: (repository: MentorAvailabilityRepository) =>
      new GetMentorAvailabilityUseCase(repository),
  },
  {
    provide: SetMentorAvailabilityUseCase,
    inject: [MENTOR_AVAILABILITY_REPOSITORY],
    useFactory: (repository: MentorAvailabilityRepository) =>
      new SetMentorAvailabilityUseCase(repository),
  },
  {
    provide: CreateMentorshipRequestUseCase,
    inject: [MENTORSHIP_REQUEST_REPOSITORY],
    useFactory: (repository: MentorshipRequestRepository) =>
      new CreateMentorshipRequestUseCase(repository),
  },
  {
    provide: GetMentorSlotsUseCase,
    inject: [MENTORSHIP_REQUEST_REPOSITORY],
    useFactory: (repository: MentorshipRequestRepository) =>
      new GetMentorSlotsUseCase(repository),
  },
];
