import { Controller, Get, Param } from '@nestjs/common';
import { z } from 'zod';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetMentorSlotsUseCase } from '../../application/use-cases/get-mentor-slots.use-case';
import { presentMentorSlots } from '../presenters/mentorship-request.presenter';

const mentorIdSchema = z.uuid().transform((value) => value.toLowerCase());

@Controller('mentorship')
export class GetMentorSlotsController {
  constructor(private readonly useCase: GetMentorSlotsUseCase) {}

  @Get('profiles/:id/slots')
  @RequirePermissions('mentores:self:write')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(mentorIdSchema)) id: string,
  ) {
    return { data: presentMentorSlots(await this.useCase.execute(actor, id)) };
  }
}
