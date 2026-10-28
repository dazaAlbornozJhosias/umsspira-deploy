import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';

import { GetPublishedEventUseCase } from '../../application/use-cases/get-published-event.use-case';
import { presentEvent } from '../presenters/event.presenter';
import { eventIdSchema } from '../schemas/events.schemas';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';

@Controller('events')
export class GetPublishedEventController {
  constructor(private readonly useCase: GetPublishedEventUseCase) {}

  @Get(':id')
  @Public()
  async handle(@Param('id', new ZodValidationPipe(eventIdSchema)) id: string) {
    return { data: presentEvent(await this.useCase.execute(id)) };
  }
}
