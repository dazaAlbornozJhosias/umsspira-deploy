import { Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { SessionCookies } from '../cookies/session.cookies';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class LogoutController {
  constructor(
    private readonly useCase: LogoutUseCase,
    private readonly cookies: SessionCookies,
  ) {}

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    await this.useCase.execute(request.auth!);
    this.cookies.clear(response);
  }
}
