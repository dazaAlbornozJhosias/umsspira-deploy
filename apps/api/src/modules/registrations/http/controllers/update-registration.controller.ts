import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UpdateRegistrationUseCase } from '../../application/use-cases/update-registration.use-case';
import type { RegistrationData } from '../../domain/entities/registration';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { registrationDataSchema, registrationIdSchema } from '../schemas/registrations.schemas';

@Controller('registrations')
export class UpdateRegistrationController {
  constructor(private readonly useCase: UpdateRegistrationUseCase) {}

  @Patch('sessions/:token')
  @PublicRegistration()
  async handle(
    @Param('token', new ZodValidationPipe(registrationIdSchema)) token: string,
    @Body(new ZodValidationPipe(registrationDataSchema)) body: RegistrationData,
  ) {
    return { data: await this.useCase.execute(token, body) };
  }
}
