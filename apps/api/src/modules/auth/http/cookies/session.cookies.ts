import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Environment } from '../../../../config/environment';
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  REFRESH_COOKIE,
} from '../../../../shared/http/auth/cookies/request-cookies';
import type { IssuedSession } from '../../application/contracts/issued-session';

@Injectable()
export class SessionCookies {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  write(response: Response, result: IssuedSession): void {
    const options = { httpOnly: true, secure: this.secure, sameSite: 'lax' as const, path: '/' };
    const persistent = result.session.remember
      ? Math.max(0, result.session.expiresAt.getTime() - Date.now())
      : undefined;
    response.cookie(ACCESS_COOKIE, result.accessToken, {
      ...options,
      ...(persistent !== undefined
        ? { maxAge: Math.min(result.expiresIn * 1000, persistent) }
        : {}),
    });
    response.cookie(REFRESH_COOKIE, result.refreshToken, {
      ...options,
      ...(persistent !== undefined ? { maxAge: persistent } : {}),
    });
    response.cookie(CSRF_COOKIE, result.csrfToken, {
      ...options,
      httpOnly: false,
      ...(persistent !== undefined ? { maxAge: persistent } : {}),
    });
  }

  clear(response: Response): void {
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE, 'umsspira_role']) {
      response.clearCookie(name, { secure: this.secure, sameSite: 'lax', path: '/' });
    }
  }

  private get secure(): boolean {
    return (
      this.config.get('AUTH_COOKIE_SECURE', { infer: true }) ??
      this.config.get('NODE_ENV', { infer: true }) === 'production'
    );
  }
}
