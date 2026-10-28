import { timingSafeEqual } from 'node:crypto';
import { ACTIVATION_TOKEN_SECONDS } from '../../domain/policies/activation.policy';
import type { RegistrationSecurity } from '../ports/registration-security.port';

// Pase del paso 1 de la activación: base64url(id.expiración) + '.' + firma.
// La firma está atada al hash vigente del código, de modo que al activar la cuenta
// (y borrar ese hash) el pase deja de ser verificable.
const PURPOSE = 'activation-token';

export interface ParsedActivationToken {
  applicationId: string;
  expiresAt: number;
  payload: string;
  signature: string;
}

export function issueActivationToken(
  security: RegistrationSecurity,
  applicationId: string,
  binding: string,
  now: number = Date.now(),
): string {
  const payload = applicationId + '.' + (now + ACTIVATION_TOKEN_SECONDS * 1000);
  const signature = security.hash(PURPOSE, payload + '.' + binding);
  return Buffer.from(payload).toString('base64url') + '.' + signature;
}

export function parseActivationToken(token: string): ParsedActivationToken | null {
  const separator = token.indexOf('.');
  if (separator < 1) {
    return null;
  }
  const payload = Buffer.from(token.slice(0, separator), 'base64url').toString();
  const signature = token.slice(separator + 1);
  const dot = payload.lastIndexOf('.');
  if (dot < 1 || !signature) {
    return null;
  }
  const expiresAt = Number(payload.slice(dot + 1));
  if (!Number.isFinite(expiresAt)) {
    return null;
  }
  return { applicationId: payload.slice(0, dot), expiresAt, payload, signature };
}

export function matchesBinding(
  security: RegistrationSecurity,
  parsed: ParsedActivationToken,
  binding: string,
): boolean {
  const expected = Buffer.from(security.hash(PURPOSE, parsed.payload + '.' + binding));
  const received = Buffer.from(parsed.signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}