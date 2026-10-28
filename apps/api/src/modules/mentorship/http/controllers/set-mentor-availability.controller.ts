import { Controller, Patch, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { SetMentorAvailabilityUseCase } from '../../application/use-cases/set-mentor-availability.use-case';
import { presentAvailability } from '../presenters/mentor.presenter';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { availabilitySchema } from '../schemas/mentorship.schemas';
import type { MentorAvailabilityInput } from '../../application/contracts/mentor-inputs';

@Controller('mentorship')
export class SetMentorAvailabilityController {
  constructor(private readonly useCase: SetMentorAvailabilityUseCase) {}
  @Patch('availability')
  @RequirePermissions('mentores:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(availabilitySchema)) body: MentorAvailabilityInput,
  ) {
    return { data: presentAvailability(await this.useCase.execute(actor, body)) };
  }
}
