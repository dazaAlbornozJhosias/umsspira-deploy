import { createHash, randomBytes } from 'node:crypto';

// 32 bytes en base64url = 43 caracteres (mismo formato que valida el frontend).
export const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const INVITATION_VALIDITY_DAYS = 7;

export function isInvitationTokenFormat(token: string): boolean {
  return INVITATION_TOKEN_PATTERN.test(token);
}

// En la base solo se guarda el hash; el token original viaja únicamente en el correo.
export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashInvitationToken(token) };
}