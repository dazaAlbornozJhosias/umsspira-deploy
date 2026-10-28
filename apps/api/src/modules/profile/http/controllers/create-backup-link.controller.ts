import { Controller, Get, Param } from '@nestjs/common';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { CreateBackupLinkUseCase } from '../../application/use-cases/create-backup-link.use-case';
import { presentBackupLink } from '../presenters/profile.presenter';
import { profileIdSchema } from '../schemas/profile.schemas';

@Controller('perfil')
export class CreateBackupLinkController {
  constructor(private readonly useCase: CreateBackupLinkUseCase) {}

  @Get('certificaciones/:id/respaldo/enlace')
  @RequirePermissions('perfil:self:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(profileIdSchema)) id: string,
  ) {
    return { data: presentBackupLink(await this.useCase.execute(actor, id)) };
  }
}
