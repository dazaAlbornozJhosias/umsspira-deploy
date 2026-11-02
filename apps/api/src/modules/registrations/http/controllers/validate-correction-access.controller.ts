import { Controller, Get, UseGuards } from '@nestjs/common';
import { CorrectionTokenGuard } from '../guards/correction-token.guard';
import { RegistrationTrafficGuard } from '../guards/registration-traffic.guard';
import { PublicRegistration } from '../decorators/public-registration.decorator';

@Controller('registrations')
export class ValidateCorrectionAccessController {
  @Get('observed/access')
  @PublicRegistration()
  @UseGuards(RegistrationTrafficGuard, CorrectionTokenGuard)
  async handle() {
    return { data: { valid: true } };
  }
}
