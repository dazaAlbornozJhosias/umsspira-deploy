import { Body, Controller, Post } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CreateMentorshipRequestUseCase } from '../../application/use-cases/create-mentorship-request.use-case';
import {
  createMentorshipRequestSchema,
  type CreateMentorshipRequestBody,
} from '../schemas/mentorship-request.schema';
import { presentMentorshipRequest } from '../presenters/mentorship-request.presenter';

@Controller('mentorship/requests')
export class CreateMentorshipRequestController {
  constructor(private readonly useCase: CreateMentorshipRequestUseCase) {}

  @Post()
  @RequirePermissions('mentores:self:write')
  async create(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(createMentorshipRequestSchema)) body: CreateMentorshipRequestBody,
  ) {
    const request = await this.useCase.execute(actor, {
      mentorId: body.mentorId,
      date: body.fecha,
      startTime: body.horaInicio,
      endTime: body.horaFin,
      message: body.mensaje,
    });
    return { data: presentMentorshipRequest(request) };
  }
}
