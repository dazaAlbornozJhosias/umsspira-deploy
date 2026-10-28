import type { Request } from 'express';
import type { AuthenticatedContext } from '../../../security/contexts/actor-context';

export type AuthRequest = Request & {
  auth?: AuthenticatedContext;
};
