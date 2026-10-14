import { Module } from '@nestjs/common';
import { MentorshipAvailabilityController } from './mentorship-availability.controller';
import { MentorshipAvailabilityService } from './mentorship-availability.service';
import { MentorshipInterestsController } from './mentorship-interests.controller';
import { MentorshipInterestsService } from './mentorship-interests.service';
import { MentorshipController } from './mentorship.controller';
import { MentorshipService } from './mentorship.service';
import { MentorAuthGuard } from './mentor-test-auth.guard';

@Module({
  controllers: [
    MentorshipController,
    MentorshipInterestsController,
    MentorshipAvailabilityController,
  ],
  providers: [
    MentorshipService,
    MentorshipInterestsService,
    MentorshipAvailabilityService,
    MentorAuthGuard,
  ],
  // MentorshipInterestsService se exporta para que el módulo de áreas use
  // removeInterestsByArea (regla 7 de HU-03). MentorshipAvailabilityService se
  // exporta para que el módulo de solicitudes use canReceiveRequests (regla 7 de HU-6.4).
  exports: [MentorshipService, MentorshipInterestsService, MentorshipAvailabilityService],
})
export class MentorshipModule {}
