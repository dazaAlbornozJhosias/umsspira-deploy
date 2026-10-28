import type { ActivateRegistrationInput } from '../../application/contracts/registration-inputs';
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ActivateRegistrationUseCase } from '../../application/use-cases/activate-registration.use-case';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { activateAccountSchema } from '../schemas/registrations.schemas';

@Controller('registrations')
export class ActivateRegistrationController {
  constructor(private readonly useCase: ActivateRegistrationUseCase) {}

  @Post('activate')
  @PublicRegistration()
  @HttpCode(200)
  async handle(
    @Body(new ZodValidationPipe(activateAccountSchema))
    body: ActivateRegistrationInput,
  ) {
    return {
      data: await this.useCase.execute(body.applicationId, body.activationToken, body.password),
    };
  }
}