export const CORRECTION_TOKEN_REGEX = /^[A-Za-z0-9_-]+$/;
export const CORRECTION_TOKEN_MAX_LENGTH = 128;

export function isValidCorrectionTokenFormat(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;
  if (token.length === 0 || token.length > CORRECTION_TOKEN_MAX_LENGTH) return false;
  return CORRECTION_TOKEN_REGEX.test(token);
}
