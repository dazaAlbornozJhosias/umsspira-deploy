import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import { OptionalAuthenticationGuard } from '../../../../shared/http/auth/guards/optional-authentication.guard';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ReadEventCoverUseCase } from '../../application/use-cases/read-event-cover.use-case';
import { eventIdSchema } from '../schemas/events.schemas';

@Controller('events')
export class ReadEventCoverController {
  constructor(private readonly useCase: ReadEventCoverUseCase) {}

  @Get('covers/:id')
  @Public()
  @UseGuards(OptionalAuthenticationGuard)
  async handle(
    @Param('id', new ZodValidationPipe(eventIdSchema)) id: string,
    @Req() request: AuthRequest,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.useCase.execute(id, request.auth?.actor);
    response.type(file.mime).setHeader('Content-Length', String(file.size));
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.setHeader(
      'Content-Disposition',
      'inline; filename="portada"; filename*=UTF-8\'\'' + encodeURIComponent(file.name),
    );
    response.send(Buffer.from(file.bytes));
  }
}
