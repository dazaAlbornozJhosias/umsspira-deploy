import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { ValidatePasswordRecoveryLinkUseCase } from '../../application/use-cases/validate-password-recovery-link.use-case';
import { recoveryLinkSchema } from '../schemas/password-recovery.schema';
import type { RecoveryLinkBody } from '../schemas/password-recovery.schema';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class ValidatePasswordRecoveryController {
  constructor(private readonly useCase: ValidatePasswordRecoveryLinkUseCase) {}

  // 204 si el enlace sirve; si no, 400, 409 o 410 con un código que distingue la causa (CA-12.5).
  @Post('password-recovery/validate')
  @Public()
  @HttpCode(204)
  async validate(@Body(new ZodValidationPipe(recoveryLinkSchema)) body: RecoveryLinkBody) {
    await this.useCase.execute(body.token);
  }
}