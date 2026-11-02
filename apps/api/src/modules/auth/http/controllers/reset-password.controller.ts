import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { SessionCookies } from '../cookies/session.cookies';
import { recoveryResetSchema } from '../schemas/password-recovery.schema';
import type { RecoveryResetBody } from '../schemas/password-recovery.schema';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class ResetPasswordController {
  constructor(
    private readonly useCase: ResetPasswordUseCase,
    private readonly cookies: SessionCookies,
  ) {}

  // Cambia la contraseña y cierra todas las sesiones de la cuenta (CA-12.4).
  @Post('password-recovery/reset')
  @Public()
  @HttpCode(204)
  async reset(
    @Body(new ZodValidationPipe(recoveryResetSchema)) body: RecoveryResetBody,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.useCase.execute(body.token, body.password);
    this.cookies.clear(response);
  }
}