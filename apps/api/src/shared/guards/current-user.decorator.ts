// apps/api/src/shared/guards/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '@umsspira/shared-types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);