import type { VerifyEmailCodeInput } from '../../application/contracts/registration-inputs';
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { VerifyRegistrationCodeUseCase } from '../../application/use-cases/verify-registration-code.use-case';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { verifyCodeSchema } from '../schemas/registrations.schemas';

@Controller('email-verification')
export class VerifyRegistrationCodeController {
  constructor(private readonly useCase: VerifyRegistrationCodeUseCase) {}

  @Post('verify')
  @PublicRegistration()
  @HttpCode(200)
  async handle(@Body(new ZodValidationPipe(verifyCodeSchema)) body: VerifyEmailCodeInput) {
    return { data: await this.useCase.execute(body.registrationId, body.code, body.email) };
  }
}
