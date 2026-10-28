import { Controller, Get, Param } from '@nestjs/common';
import { InspectRegistrationUseCase } from '../../application/use-cases/inspect-registration.use-case';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { registrationIdSchema } from '../schemas/registrations.schemas';

@Controller('registrations')
export class InspectRegistrationController {
  constructor(private readonly useCase: InspectRegistrationUseCase) {}

  @Get('sessions/:token')
  @PublicRegistration()
  async handle(@Param('token', new ZodValidationPipe(registrationIdSchema)) token: string) {
    return { data: await this.useCase.execute(token) };
  }
}
