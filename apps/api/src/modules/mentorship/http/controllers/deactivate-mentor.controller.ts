import { Controller, Patch, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { DeactivateMentorUseCase } from '../../application/use-cases/deactivate-mentor.use-case';
import { presentMentor } from '../presenters/mentor.presenter';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { mentorIdSchema } from '../schemas/mentorship.schemas';

@Controller('mentorship')
export class DeactivateMentorController {
  constructor(private readonly useCase: DeactivateMentorUseCase) {}
  @Patch('profiles/:id/deactivate')
  @RequirePermissions('mentores:manage')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(mentorIdSchema)) id: string,
  ) {
    return { data: presentMentor(await this.useCase.execute(actor, id)) };
  }
}
