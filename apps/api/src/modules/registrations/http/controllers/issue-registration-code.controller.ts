import type { IssueEmailCodeInput } from '../../application/contracts/registration-inputs';
import { Controller, Post, Body } from '@nestjs/common';
import { IssueRegistrationCodeUseCase } from '../../application/use-cases/issue-registration-code.use-case';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { issueCodeSchema } from '../schemas/registrations.schemas';

@Controller('email-verification')
export class IssueRegistrationCodeController {
  constructor(private readonly useCase: IssueRegistrationCodeUseCase) {}

  @Post('resend')
  @PublicRegistration()
  async handle(@Body(new ZodValidationPipe(issueCodeSchema)) body: IssueEmailCodeInput) {
    return { data: await this.useCase.execute(body.registrationId, body.email) };
  }
}
