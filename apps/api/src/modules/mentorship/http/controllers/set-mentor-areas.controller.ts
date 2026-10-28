import { Controller, Patch, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { SetMentorAreasUseCase } from '../../application/use-cases/set-mentor-areas.use-case';
import { presentMentorAreas } from '../presenters/mentor.presenter';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { mentorAreasSchema } from '../schemas/mentorship.schemas';
import type { MentorAreasInput } from '../../application/contracts/mentor-inputs';

@Controller('mentorship')
export class SetMentorAreasController {
  constructor(private readonly useCase: SetMentorAreasUseCase) {}
  @Patch('my-profile/areas')
  @RequirePermissions('mentores:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(mentorAreasSchema)) body: MentorAreasInput,
  ) {
    return { data: presentMentorAreas(await this.useCase.execute(actor, body)) };
  }
}
