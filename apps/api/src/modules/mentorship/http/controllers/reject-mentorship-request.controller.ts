import { Controller, Param, Patch } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { RespondToMentorshipRequestUseCase } from '../../application/use-cases/respond-to-mentorship-request.use-case';
import { mentorshipRequestIdSchema } from '../schemas/mentorship-request-id.schema';
import { presentMentorshipRequest } from '../presenters/mentorship-request.presenter';

@Controller('mentorship/requests')
export class RejectMentorshipRequestController {
  constructor(private readonly useCase: RespondToMentorshipRequestUseCase) {}

  @Patch(':id/reject')
  async reject(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(mentorshipRequestIdSchema)) requestId: string,
  ) {
    return {
      data: presentMentorshipRequest(await this.useCase.execute(actor, requestId, 'RECHAZADO')),
    };
  }
}
