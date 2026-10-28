import { Controller, Post, Body } from '@nestjs/common';
import { SubmitRegistrationUseCase } from '../../application/use-cases/submit-registration.use-case';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { submitRegistrationSchema } from '../schemas/registrations.schemas';
import type { SubmitRegistrationInput } from '../../application/contracts/registration-inputs';
import { presentSubmission } from '../presenters/submission.presenter';

@Controller('registrations')
export class SubmitRegistrationController {
  constructor(private readonly useCase: SubmitRegistrationUseCase) {}

  @Post('submit')
  @PublicRegistration()
  async handle(
    @Body(new ZodValidationPipe(submitRegistrationSchema)) body: SubmitRegistrationInput,
  ) {
    return { data: presentSubmission(await this.useCase.execute(body)) };
  }
}
