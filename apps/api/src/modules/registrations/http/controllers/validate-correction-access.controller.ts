import { Controller, Get, UseGuards } from '@nestjs/common';
import { CorrectionTokenGuard } from '../guards/correction-token.guard';
import { PublicRegistration } from '../decorators/public-registration.decorator';

@Controller('registrations')
export class ValidateCorrectionAccessController {
  @Get('observed/access')
  @PublicRegistration()
  @UseGuards(CorrectionTokenGuard)
  async handle() {
    return { data: { valid: true } };
  }
}
