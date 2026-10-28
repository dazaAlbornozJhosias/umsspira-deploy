import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { PublicRegistration } from '../decorators/public-registration.decorator';
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
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body(new ZodValidationPipe(requestCorrectionLinkSchema)) body: RequestCorrectionLinkInput,
  ) {
    return { data: await this.useCase.execute(body) };
  }
}
