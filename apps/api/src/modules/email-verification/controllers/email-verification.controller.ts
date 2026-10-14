import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ResendCodeDto, VerifyEmailDto } from '../contracts/dto';
import { EmailVerificationService } from '../services/email-verification.service';

@Controller('api/email-verification')
export class EmailVerificationController {
  constructor(private readonly service: EmailVerificationService) {}

  // 201 Created: se crea y despacha un código nuevo
  @Post('resend')
  async resendCode(@Body() dto: ResendCodeDto) {
    return { data: await this.service.issueCode(dto.registrationId) };
  }

  // 200 OK: acción de validación
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return { data: await this.service.verifyCode(dto.registrationId, dto.code) };
  }
}