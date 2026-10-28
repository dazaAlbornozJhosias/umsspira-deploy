import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';

import { GetEventCatalogUseCase } from '../../application/use-cases/get-event-catalog.use-case';
import { presentEvent } from '../presenters/event.presenter';

@Controller('events')
export class GetEventCatalogController {
  constructor(private readonly useCase: GetEventCatalogUseCase) {}

  @Get('catalog')
  @Public()
  async handle() {
    return { data: (await this.useCase.execute()).map(presentEvent) };
  }
}
