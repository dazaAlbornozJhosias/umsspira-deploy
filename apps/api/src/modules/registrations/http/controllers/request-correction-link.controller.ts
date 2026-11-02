import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { RegistrationTrafficGuard } from '../guards/registration-traffic.guard';
import {
  requestCorrectionLinkSchema,
  type RequestCorrectionLinkInput,
} from '../schemas/registrations.schemas';
import { RequestCorrectionLinkUseCase } from '../../application/use-cases/request-correction-link.use-case';

@Controller('registrations')
export class RequestCorrectionLinkController {
  constructor(private readonly useCase: RequestCorrectionLinkUseCase) {}

  @Post('observed/request-link')
  @PublicRegistration()
  @UseGuards(RegistrationTrafficGuard)
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body(new ZodValidationPipe(requestCorrectionLinkSchema)) body: RequestCorrectionLinkInput,
  ) {
    return { data: await this.useCase.execute(body) };
  }
}
