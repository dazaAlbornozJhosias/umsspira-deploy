import type { Request } from 'express';
import { AccessError } from '../../../security/errors/access-error';

export const ACCESS_COOKIE = 'umsspira_token';
export const REFRESH_COOKIE = 'umsspira_refresh';
export const CSRF_COOKIE = 'umsspira_csrf';

export function readCookie(request: Request, name: string): string | undefined {
  const values = (request.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`));
  if (values.length > 1) {
    throw new AccessError('UNAUTHENTICATED');
  }
  if (!values.length) {
    return undefined;
  }
  try {
    const value = decodeURIComponent(values[0].slice(name.length + 1));
    if (value.length > 4096) {
      throw new Error('Cookie demasiado larga');
    }
    return value;
  } catch {
    throw new AccessError('UNAUTHENTICATED');
  }
}

export function csrfHeader(request: Request): string {
  const token = request.headers['x-csrf-token'];
  return typeof token === 'string' && token.length <= 128 ? token : '';
}
