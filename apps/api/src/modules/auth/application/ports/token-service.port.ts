import type { AccessClaims } from '../contracts/access-claims';
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
export interface TokenService {
  id(): string;
  secret(): string;
  fingerprint(value: string): string;
  matches(value: string, fingerprint: string): boolean;
  readRefreshSessionId(token: string): string;
  issueAccess(claims: AccessClaims): string;
  verifyAccess(token: string): AccessClaims;
}
