import { Controller, Patch, Body } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { SetMentorParticipationUseCase } from '../../application/use-cases/set-mentor-participation.use-case';
import { presentMentor } from '../presenters/mentor.presenter';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { participationSchema } from '../schemas/mentorship.schemas';
import type { ParticipationInput } from '../../application/contracts/mentor-inputs';

@Controller('mentorship')
export class SetMentorParticipationController {
  constructor(private readonly useCase: SetMentorParticipationUseCase) {}
  @Patch('my-profile/participation')
  @RequirePermissions('mentores:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(participationSchema)) body: ParticipationInput,
  ) {
    return { data: presentMentor(await this.useCase.execute(actor, body)) };
  }
}
