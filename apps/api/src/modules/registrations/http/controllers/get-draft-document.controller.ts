import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GetDraftDocumentUseCase } from '../../application/use-cases/get-draft-document.use-case';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { registrationIdSchema } from '../schemas/registrations.schemas';

@Controller('registrations')
export class GetDraftDocumentController {
  constructor(private readonly useCase: GetDraftDocumentUseCase) {}

  @Get('sessions/:token/document')
  @PublicRegistration()
  async handle(
    @Param('token', new ZodValidationPipe(registrationIdSchema)) token: string,
    @Res() response: Response,
  ) {
    const file = await this.useCase.execute(token);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Type', file.mime);
    response.setHeader('Content-Disposition', 'inline; filename="respaldo"');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(Buffer.from(file.bytes));
  }
}
