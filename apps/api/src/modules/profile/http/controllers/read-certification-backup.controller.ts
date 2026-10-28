import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { RequirePermissions } from '../../../../shared/http/auth/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { ReadCertificationBackupUseCase } from '../../application/use-cases/read-certification-backup.use-case';
import { profileIdSchema } from '../schemas/profile.schemas';

@Controller('perfil')
export class ReadCertificationBackupController {
  constructor(private readonly useCase: ReadCertificationBackupUseCase) {}

  @Get('certificaciones/:id/respaldo')
  @RequirePermissions('perfil:self:read')
  async handle(
    @CurrentActor() actor: ActorContext,
    @Param('id', new ZodValidationPipe(profileIdSchema)) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.useCase.execute(actor, id);
    response.type(file.mime).setHeader('Content-Length', String(file.size));
    response.setHeader(
      'Content-Disposition',
      'inline; filename="respaldo.jpg"; filename*=UTF-8\'\'' + encodeURIComponent(file.name),
    );
    response.send(Buffer.from(file.bytes));
  }
}
