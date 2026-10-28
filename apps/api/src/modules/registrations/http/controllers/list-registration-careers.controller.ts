import { Controller, Get } from '@nestjs/common';
import { ListRegistrationCareersUseCase } from '../../application/use-cases/list-registration-careers.use-case';
import { PublicRegistration } from '../decorators/public-registration.decorator';

@Controller('registrations')
export class ListRegistrationCareersController {
  constructor(private readonly useCase: ListRegistrationCareersUseCase) {}

  @Get('careers')
  @PublicRegistration()
  async handle() {
    return { data: await this.useCase.execute() };
  }
}
