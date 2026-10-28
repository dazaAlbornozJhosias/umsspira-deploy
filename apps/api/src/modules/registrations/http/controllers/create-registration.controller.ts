import { Controller, Post, Body } from '@nestjs/common';
import { CreateRegistrationUseCase } from '../../application/use-cases/create-registration.use-case';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { registrationDataSchema } from '../schemas/registrations.schemas';
import type { RegistrationData } from '../../domain/entities/registration';

@Controller('registrations')
export class CreateRegistrationController {
  constructor(private readonly useCase: CreateRegistrationUseCase) {}

  @Post('sessions')
  @PublicRegistration()
  async handle(@Body(new ZodValidationPipe(registrationDataSchema)) body: RegistrationData) {
    return { data: await this.useCase.execute(body) };
  }
}
