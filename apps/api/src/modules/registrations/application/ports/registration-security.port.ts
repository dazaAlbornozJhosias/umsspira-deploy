import type { Notification } from '../contracts/registration-inputs';

export const REGISTRATION_SECURITY = Symbol('REGISTRATION_SECURITY');

export interface RegistrationSecurity {
  token(): string;
  code(): string;
  hash(purpose: string, value: string): string;
  seal(value: Notification & { html?: string }): string;
}
