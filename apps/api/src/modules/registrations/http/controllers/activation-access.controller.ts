import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { PublicRegistration } from '../decorators/public-registration.decorator';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ActivationAccessService } from '../../application/services/activation-access.service';

const schema = z.strictObject({ applicationId: z.uuid() });

@Controller('registrations/activate')
export class ActivationAccessController {
  constructor(private readonly service: ActivationAccessService) {}

  @Post('status')
  @PublicRegistration()
  @HttpCode(200)
  async status(@Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>) {
    return { data: await this.service.inspect(body.applicationId) };
  }

  @Post('resend')
  @PublicRegistration()
  @HttpCode(200)
  async resend(@Body(new ZodValidationPipe(schema)) body: z.infer<typeof schema>) {
    return { data: await this.service.resend(body.applicationId) };
  }
}
