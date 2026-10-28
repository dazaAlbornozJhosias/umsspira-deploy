import { Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../../../shared/http/auth/decorators/public.decorator';
import { REFRESH_COOKIE } from '../../../../shared/http/auth/cookies/request-cookies';
import { csrfHeader } from '../../../../shared/http/auth/cookies/request-cookies';
import { readCookie } from '../../../../shared/http/auth/cookies/request-cookies';
import type { AuthRequest } from '../../../../shared/http/auth/contracts/auth-request';
import { TrustedOriginGuard } from '../../../../shared/http/auth/guards/trusted-origin.guard';
import { presentLogin } from '../presenters/login.presenter';
import { SessionCookies } from '../cookies/session.cookies';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';

@Controller('auth')
@UseGuards(TrustedOriginGuard)
export class RefreshSessionController {
  constructor(
    private readonly useCase: RefreshSessionUseCase,
    private readonly cookies: SessionCookies,
  ) {}

  @Post('refresh')
  @Public()
  @HttpCode(200)
  async refresh(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    const result = await this.useCase.execute(
      readCookie(request, REFRESH_COOKIE) ?? '',
      csrfHeader(request),
      request.ip ?? 'desconocida',
    );
    this.cookies.write(response, result);
    return presentLogin(result);
  }
}
