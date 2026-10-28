import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ExportProfileUseCase } from '../../application/use-cases/export-profile.use-case';
import { presentProfileExport } from '../presenters/profile-export.presenter';

@Controller('perfil')
export class ExportProfileController {
  constructor(private readonly useCase: ExportProfileUseCase) {}

  @Get('exportar-json')
  @RequirePermissions('perfil:self:read')
  async handle(@CurrentActor() actor: ActorContext, @Res() response: Response): Promise<void> {
    const result = await this.useCase.execute(actor);
    const file = presentProfileExport(result.profile, result.exportedAt);
    response
      .type('application/json')
      .setHeader('Content-Disposition', 'attachment; filename="' + file.name + '"');
    response.send(file.content);
  }
}
