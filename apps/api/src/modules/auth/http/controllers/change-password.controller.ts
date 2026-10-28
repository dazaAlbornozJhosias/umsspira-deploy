import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentActor } from '../../../../shared/http/auth/decorators/current-actor.decorator';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { ZodValidationPipe } from '../../../../shared/http/pipes/zod-validation.pipe';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { passwordSchema } from '../schemas/change-password.schema';
import type { PasswordBody } from '../schemas/change-password.schema';
import { SessionCookies } from '../cookies/session.cookies';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class ChangePasswordController {
  constructor(
    private readonly useCase: ChangePasswordUseCase,
    private readonly cookies: SessionCookies,
  ) {}

  @Post('password')
  @HttpCode(204)
  async password(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(passwordSchema)) body: PasswordBody,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.useCase.execute(actor, body.currentPassword, body.newPassword);
    this.cookies.clear(response);
  }
}
