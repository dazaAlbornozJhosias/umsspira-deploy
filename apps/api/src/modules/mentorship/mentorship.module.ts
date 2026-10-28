import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';
import { RegistrationsModule } from '../registrations/registrations.module';
import { mentorshipProviders } from './infrastructure/providers/mentorship.providers';
import { MENTOR_AVAILABILITY_REPOSITORY } from './application/ports/mentor-availability-repository.port';
import { ListMentorProfilesController } from './http/controllers/list-mentor-profiles.controller';
import { FilterMentorProfilesController } from './http/controllers/filter-mentor-profiles.controller';
import { GetMentorFilterOptionsController } from './http/controllers/get-mentor-filter-options.controller';
import { GetMentorDetailController } from './http/controllers/get-mentor-detail.controller';
import { GetMentorEligibilityController } from './http/controllers/get-mentor-eligibility.controller';
import { GetMyMentorProfileController } from './http/controllers/get-my-mentor-profile.controller';
import { GetMentorInformationController } from './http/controllers/get-mentor-information.controller';
import { UpdateMentorInformationController } from './http/controllers/update-mentor-information.controller';
import { ClearMentorInformationController } from './http/controllers/clear-mentor-information.controller';
import { SetMentorParticipationController } from './http/controllers/set-mentor-participation.controller';
import { DeactivateMentorController } from './http/controllers/deactivate-mentor.controller';
import { GetMentorAreasController } from './http/controllers/get-mentor-areas.controller';
import { SetMentorAreasController } from './http/controllers/set-mentor-areas.controller';
import { GetMentorInterestCatalogController } from './http/controllers/get-mentor-interest-catalog.controller';
import { GetMyMentorInterestsController } from './http/controllers/get-my-mentor-interests.controller';
import { AddMentorInterestsController } from './http/controllers/add-mentor-interests.controller';
import { RemoveMentorInterestController } from './http/controllers/remove-mentor-interest.controller';
import { GetMentorAvailabilityController } from './http/controllers/get-mentor-availability.controller';
import { SetMentorAvailabilityController } from './http/controllers/set-mentor-availability.controller';
import { CreateMentorshipRequestController } from './http/controllers/create-mentorship-request.controller';
import { ListReceivedMentorshipRequestsController } from './http/controllers/list-received-mentorship-requests.controller';
import { GetReceivedMentorshipRequestController } from './http/controllers/get-received-mentorship-request.controller';
import { AcceptMentorshipRequestController } from './http/controllers/accept-mentorship-request.controller';
import { RejectMentorshipRequestController } from './http/controllers/reject-mentorship-request.controller';
import { GetMentorSlotsController } from './http/controllers/get-mentor-slots.controller';

@Module({
  imports: [PrismaModule, RegistrationsModule],
  controllers: [
    ListMentorProfilesController,
    FilterMentorProfilesController,
    GetMentorFilterOptionsController,
    GetMentorDetailController,
    GetMentorEligibilityController,
    GetMyMentorProfileController,
    GetMentorInformationController,
    UpdateMentorInformationController,
    ClearMentorInformationController,
    SetMentorParticipationController,
    DeactivateMentorController,
    GetMentorAreasController,
    SetMentorAreasController,
    GetMentorInterestCatalogController,
    GetMyMentorInterestsController,
    AddMentorInterestsController,
    RemoveMentorInterestController,
    GetMentorAvailabilityController,
    SetMentorAvailabilityController,
    CreateMentorshipRequestController,
    ListReceivedMentorshipRequestsController,
    GetReceivedMentorshipRequestController,
    AcceptMentorshipRequestController,
    RejectMentorshipRequestController,
    GetMentorSlotsController,
  ],
  providers: mentorshipProviders,
  exports: [MENTOR_AVAILABILITY_REPOSITORY],
})
export class MentorshipModule {}
