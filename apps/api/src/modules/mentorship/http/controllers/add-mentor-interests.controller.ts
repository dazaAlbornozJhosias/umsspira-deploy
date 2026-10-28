import { Controller, Post, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { AddMentorInterestsUseCase } from '../../application/use-cases/add-mentor-interests.use-case';
import { presentInterest } from '../presenters/mentor.presenter';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { mentorInterestsSchema } from '../schemas/mentorship.schemas';
import type { MentorInterestsInput } from '../../application/contracts/mentor-inputs';

@Controller('mentorship')
export class AddMentorInterestsController {
  constructor(private readonly useCase: AddMentorInterestsUseCase) {}
  @Post('interests')
  @RequirePermissions('mentores:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(mentorInterestsSchema)) body: MentorInterestsInput,
  ) {
    return { data: (await this.useCase.execute(actor, body)).map(presentInterest) };
  }
}
