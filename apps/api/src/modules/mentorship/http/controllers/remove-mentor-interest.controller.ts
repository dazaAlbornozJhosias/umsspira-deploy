import { Controller, Delete, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { RemoveMentorInterestUseCase } from '../../application/use-cases/remove-mentor-interest.use-case';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { mentorIdSchema } from '../schemas/mentorship.schemas';

@Controller('mentorship')
export class RemoveMentorInterestController {
  constructor(private readonly useCase: RemoveMentorInterestUseCase) {}
  @Delete('interests/:id')
  @RequirePermissions('mentores:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(mentorIdSchema)) id: string,
  ) {
    return { data: await this.useCase.execute(actor, id) };
  }
}
