import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { GetApplicationDocumentUseCase } from '../../application/use-cases/get-application-document.use-case';
import { registrationIdSchema } from '../schemas/registrations.schemas';

@Controller('applications')
export class GetApplicationDocumentController {
  constructor(private readonly useCase: GetApplicationDocumentUseCase) {}

  @Get(':id/document/content')
  @RequirePermissions('solicitudes:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(registrationIdSchema)) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.useCase.execute(actor, id);
    response.setHeader('Content-Type', file.mime);
    response.setHeader('Content-Length', String(file.size));
    response.setHeader(
      'Content-Disposition',
      'inline; filename="respaldo"; filename*=UTF-8\'\'' + encodeURIComponent(file.name),
    );
    response.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    response.send(Buffer.from(file.bytes));
  }
}
