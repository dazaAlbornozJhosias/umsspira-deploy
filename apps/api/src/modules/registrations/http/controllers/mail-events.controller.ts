import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { RetryMailEventsUseCase } from '../../application/use-cases/retry-mail-events.use-case';
import { registrationIdSchema } from '../schemas/registrations.schemas';

@Controller('mail-events')
export class MailEventsController {
  constructor(private readonly useCase: RetryMailEventsUseCase) {}

  @Post('retry-failed')
  @HttpCode(200)
  @RequirePermissions('solicitudes:review')
  async retryFailed(@CurrentActor() actor: ActorContext) {
    return { data: await this.useCase.retryFailed(actor) };
  }

  @Post(':id/retry')
  @HttpCode(200)
  @RequirePermissions('solicitudes:review')
  async retryOne(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(registrationIdSchema)) id: string,
  ) {
    return { data: await this.useCase.retryOne(actor, id) };
  }
}