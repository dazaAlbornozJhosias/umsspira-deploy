import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetApplicationUseCase } from '../../application/use-cases/get-application.use-case';
import { registrationIdSchema } from '../schemas/registrations.schemas';

@Controller('applications')
export class GetApplicationDocumentLinkController {
  constructor(private readonly useCase: GetApplicationUseCase) {}

  @Get(':id/document')
  @RequirePermissions('solicitudes:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(registrationIdSchema)) id: string,
  ) {
    const detail = await this.useCase.execute(actor, id);
    return {
      data: detail.documentPath
        ? { url: '/api/v1/applications/' + id + '/document/content', requiresAuthentication: true }
        : null,
    };
  }
}
