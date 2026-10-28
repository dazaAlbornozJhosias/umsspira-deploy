export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');
export interface AuthOptions {
  accessSeconds: number;
  sessionHours: number;
  rememberDays: number;
}
