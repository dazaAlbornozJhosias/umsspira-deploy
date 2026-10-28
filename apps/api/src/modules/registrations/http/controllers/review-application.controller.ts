import { Controller, Post, Body, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ReviewApplicationUseCase } from '../../application/use-cases/review-application.use-case';
import { registrationIdSchema, reviewSchema } from '../schemas/registrations.schemas';
import type { ReviewInput } from '../../application/contracts/registration-inputs';

@Controller('applications')
export class ReviewApplicationController {
  constructor(private readonly useCase: ReviewApplicationUseCase) {}

  @Post(':id/review')
  @RequirePermissions('solicitudes:review')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(registrationIdSchema)) id: string,
    @Body(new ZodValidationPipe(reviewSchema)) body: ReviewInput,
  ) {
    return { data: await this.useCase.execute(actor, id, body) };
  }
}
