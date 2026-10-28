import { Controller, Patch, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { UpdateMentorInformationUseCase } from '../../application/use-cases/update-mentor-information.use-case';
import { presentMentorInformation } from '../presenters/mentor.presenter';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { mentorInformationSchema } from '../schemas/mentorship.schemas';
import type { MentorInformationInput } from '../../application/contracts/mentor-inputs';

@Controller('mentorship')
export class UpdateMentorInformationController {
  constructor(private readonly useCase: UpdateMentorInformationUseCase) {}
  @Patch('my-profile/information')
  @RequirePermissions('mentores:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(mentorInformationSchema)) body: MentorInformationInput,
  ) {
    return { data: presentMentorInformation(await this.useCase.execute(actor, body)) };
  }
}
