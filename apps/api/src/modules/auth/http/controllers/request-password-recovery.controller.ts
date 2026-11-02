import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import { RequestPasswordRecoveryUseCase } from '../../application/use-cases/request-password-recovery.use-case';
import { RECOVERY_GENERIC_MESSAGE } from '../../domain/policies/password-recovery.policy';
import { recoveryRequestSchema } from '../schemas/password-recovery.schema';
import type { RecoveryRequestBody } from '../schemas/password-recovery.schema';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class RequestPasswordRecoveryController {
  constructor(private readonly useCase: RequestPasswordRecoveryUseCase) {}

  // Siempre 202 con el mismo mensaje, exista o no la cuenta (CA-12.2).
  @Post('password-recovery/request')
  @Public()
  @HttpCode(202)
  async request(
    @Body(new ZodValidationPipe(recoveryRequestSchema)) body: RecoveryRequestBody,
    @Req() request: AuthRequest,
  ) {
    await this.useCase.execute({ email: body.email, origin: request.ip ?? 'desconocido' });
    return { data: { message: RECOVERY_GENERIC_MESSAGE } };
  }
}