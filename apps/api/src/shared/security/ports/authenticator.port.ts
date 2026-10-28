import type { AuthenticatedContext } from '../contexts/actor-context';

export const AUTHENTICATOR = Symbol('AUTHENTICATOR');

export interface Authenticator {
  execute(accessToken: string, csrfToken?: string): Promise<AuthenticatedContext>;
}
