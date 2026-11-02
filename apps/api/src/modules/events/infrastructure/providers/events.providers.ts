import type { Provider } from '@nestjs/common';
import {
  EVENTS_REPOSITORY,
  type EventsRepository,
} from '../../application/ports/events-repository.port';
import { PrismaEventsRepository } from '../repositories/prisma-events.repository';
import { GetEventCatalogUseCase } from '../../application/use-cases/get-event-catalog.use-case';
import { GetPublishedEventUseCase } from '../../application/use-cases/get-published-event.use-case';
import { ListOwnedEventsUseCase } from '../../application/use-cases/list-owned-events.use-case';
import { GetOwnedEventUseCase } from '../../application/use-cases/get-owned-event.use-case';
import { GetEventDraftUseCase } from '../../application/use-cases/get-event-draft.use-case';
import { CreateEventUseCase } from '../../application/use-cases/create-event.use-case';
import { UpdateEventDraftUseCase } from '../../application/use-cases/update-event-draft.use-case';
import { UpdatePublishedEventUseCase } from '../../application/use-cases/update-published-event.use-case';
import { PublishEventDraftUseCase } from '../../application/use-cases/publish-event-draft.use-case';
import { CancelPublishedEventUseCase } from '../../application/use-cases/cancel-published-event.use-case';
import { DeleteEventCoverUseCase } from '../../application/use-cases/delete-event-cover.use-case';
import { ReadEventCoverUseCase } from '../../application/use-cases/read-event-cover.use-case';
import { UploadEventCoverUseCase } from '../../application/use-cases/upload-event-cover.use-case';
import { RegisterEventUseCase } from '../../application/use-cases/register-event.use-case';
import { CancelEventRegistrationUseCase } from '../../application/use-cases/cancel-event-registration.use-case';
import { GetEventParticipantsUseCase } from '../../application/use-cases/get-event-participants.use-case';
import { ListInactiveEventsUseCase } from '../../application/use-cases/list-inactive-events.use-case';
import { RetireEventUseCase } from '../../application/use-cases/retire-event.use-case';
import { ListMyEventRegistrationsUseCase } from '../../application/use-cases/list-my-event-registrations.use-case';

// 1. IMPORTACIÓN DEL SERVICIO QR
import { GenerateEventPassService } from '../../application/generate-event-pass.service';

export const eventsProviders: Provider[] = [
  PrismaEventsRepository,
  { provide: EVENTS_REPOSITORY, useExisting: PrismaEventsRepository },
  {
    provide: GetEventCatalogUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new GetEventCatalogUseCase(repository),
  },
  {
    provide: GetPublishedEventUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new GetPublishedEventUseCase(repository),
  },
  {
    provide: ListOwnedEventsUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new ListOwnedEventsUseCase(repository),
  },
  {
    provide: GetOwnedEventUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new GetOwnedEventUseCase(repository),
  },
  {
    provide: GetEventDraftUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new GetEventDraftUseCase(repository),
  },
  {
    provide: CreateEventUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new CreateEventUseCase(repository),
  },
  {
    provide: UpdateEventDraftUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new UpdateEventDraftUseCase(repository),
  },
  {
    provide: UpdatePublishedEventUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new UpdatePublishedEventUseCase(repository),
  },
  {
    provide: PublishEventDraftUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new PublishEventDraftUseCase(repository),
  },
  // 2. CASO DE USO DE INSCRIPCIÓN CORREGIDO CON EL GENERADOR DE QR
  {
    provide: RegisterEventUseCase,
    inject: [EVENTS_REPOSITORY, GenerateEventPassService],
    useFactory: (repository: EventsRepository, generatePassService: GenerateEventPassService) => new RegisterEventUseCase(repository, generatePassService),
  },
  {
    provide: CancelEventRegistrationUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new CancelEventRegistrationUseCase(repository),
  },
  {
    provide: GetEventParticipantsUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new GetEventParticipantsUseCase(repository),
  },
  {
    provide: CancelPublishedEventUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new CancelPublishedEventUseCase(repository),
  },
  {
    provide: DeleteEventCoverUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new DeleteEventCoverUseCase(repository),
  },
  {
    provide: ReadEventCoverUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new ReadEventCoverUseCase(repository),
  },
  {
    provide: UploadEventCoverUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new UploadEventCoverUseCase(repository),
  },
  {
    provide: ListInactiveEventsUseCase,
    useFactory: (repository: EventsRepository) => new ListInactiveEventsUseCase(repository),
    inject: [EVENTS_REPOSITORY],
  },
  {
    provide: RetireEventUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new RetireEventUseCase(repository),
  },
  {
    provide: ListMyEventRegistrationsUseCase,
    inject: [EVENTS_REPOSITORY],
    useFactory: (repository: EventsRepository) => new ListMyEventRegistrationsUseCase(repository),
  },
];