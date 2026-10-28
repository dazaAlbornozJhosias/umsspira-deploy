import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { z } from 'zod';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ReadSignedBackupUseCase } from '../../application/use-cases/read-signed-backup.use-case';
import { profileIdSchema, signedBackupQuerySchema } from '../schemas/profile.schemas';

@Controller('perfil')
export class ReadSignedBackupController {
  constructor(private readonly useCase: ReadSignedBackupUseCase) {}

  @Public()
  @Get('respaldos/:id/archivo')
  async handle(
    @Param('id', new ZodValidationPipe(profileIdSchema)) id: string,
    @Query(new ZodValidationPipe(signedBackupQuerySchema))
    query: z.infer<typeof signedBackupQuerySchema>,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.useCase.execute(id, query.expira, query.firma);
    const disposition = query.descargar ? 'attachment' : 'inline';
    response.type(file.mime).setHeader('Content-Length', String(file.size));
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader(
      'Content-Disposition',
      `${disposition}; filename="respaldo.jpg"; filename*=UTF-8''` + encodeURIComponent(file.name),
    );
    response.send(Buffer.from(file.bytes));
  }
}
