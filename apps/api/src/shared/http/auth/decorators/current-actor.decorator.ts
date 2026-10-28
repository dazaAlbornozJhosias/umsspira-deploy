import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessError } from '../../../security/errors/access-error';
import type { AuthRequest } from '../contracts/auth-request';

export const CurrentActor = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const actor = context.switchToHttp().getRequest<AuthRequest>().auth?.actor;
  if (!actor) {
    throw new AccessError('UNAUTHENTICATED');
  }
  return actor;
});
