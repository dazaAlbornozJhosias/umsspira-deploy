import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetReceivedMentorshipRequestUseCase } from '../../application/use-cases/get-received-mentorship-request.use-case';
import { mentorshipRequestIdSchema } from '../schemas/mentorship-request-id.schema';
import { presentMentorshipRequest } from '../presenters/mentorship-request.presenter';

@Controller('mentorship/requests')
export class GetReceivedMentorshipRequestController {
  constructor(private readonly useCase: GetReceivedMentorshipRequestUseCase) {}

  @Get(':id')
  async get(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(mentorshipRequestIdSchema)) requestId: string,
  ) {
    return { data: presentMentorshipRequest(await this.useCase.execute(actor, requestId)) };
  }
}
