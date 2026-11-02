import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OptionalAuthenticationGuard } from '../../shared/http/auth/guards/optional-authentication.guard';
import { eventsProviders } from './infrastructure/providers/events.providers';
import { GetEventCatalogController } from './http/controllers/get-event-catalog.controller';
import { ListMyEventRegistrationsController } from './http/controllers/list-my-event-registrations.controller';
import { GetPublishedEventController } from './http/controllers/get-published-event.controller';
import { ListOwnedEventsController } from './http/controllers/list-owned-events.controller';
import { GetOwnedEventController } from './http/controllers/get-owned-event.controller';
import { GetEventDraftController } from './http/controllers/get-event-draft.controller';
import { CreateEventController } from './http/controllers/create-event.controller';
import { UpdateEventDraftController } from './http/controllers/update-event-draft.controller';
import { UpdatePublishedEventController } from './http/controllers/update-published-event.controller';
import { PublishEventDraftController } from './http/controllers/publish-event-draft.controller';
import { ListInactiveEventsController } from './http/controllers/list-inactive-events.controller';
import { RetireEventController } from './http/controllers/retire-event.controller';
import { DeleteEventCoverController } from './http/controllers/delete-event-cover.controller';
import { ReadEventCoverController } from './http/controllers/read-event-cover.controller';
import { UploadEventCoverController } from './http/controllers/upload-event-cover.controller';
import { RegisterEventController } from './http/controllers/register-event.controller';
import { GetEventParticipantsController } from './http/controllers/get-event-participants.controller';
import { GenerateEventPassService } from './application/generate-event-pass.service';
import { ListUserPassesService } from './application/list-user-passes.service'; // <-- 1. AÑADIDO AQUÍ
import { EventPassesController } from './http/event-passes.controller';
import { CancelPublishedEventController } from './http/controllers/cancel-published-event.controller';
import { CancelEventRegistrationController } from './http/controllers/cancel-event-registration.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    GetEventCatalogController,
    ListMyEventRegistrationsController,
    ListOwnedEventsController,
    GetOwnedEventController,
    GetEventDraftController,
    CreateEventController,
    UpdateEventDraftController,
    UpdatePublishedEventController,
    PublishEventDraftController,
    ListInactiveEventsController,
    RetireEventController,
    DeleteEventCoverController,
    ReadEventCoverController,
    UploadEventCoverController,
    GetPublishedEventController,
    RegisterEventController,
    CancelEventRegistrationController,
    GetEventParticipantsController,
    EventPassesController,
    CancelPublishedEventController,
  ],
  providers: [...eventsProviders, OptionalAuthenticationGuard , GenerateEventPassService, ListUserPassesService],
})
export class EventsModule {}
