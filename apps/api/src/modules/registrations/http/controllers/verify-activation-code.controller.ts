import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { VerifyActivationCodeUseCase } from '../../application/use-cases/verify-activation-code.use-case';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import {
  verifyActivationSchema,
  type VerifyActivationInput,
} from '../schemas/registrations.schemas';

@Controller('registrations')
export class VerifyActivationCodeController {
  constructor(private readonly useCase: VerifyActivationCodeUseCase) {}

  @Post('activate/verify')
  @PublicRegistration()
  @HttpCode(200)
  async handle(
    @Body(new ZodValidationPipe(verifyActivationSchema))
    body: VerifyActivationInput,
  ) {
    return { data: await this.useCase.execute(body.applicationId, body.code) };
  }
}