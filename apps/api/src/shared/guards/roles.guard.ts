// apps/api/src/shared/guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@umsspira/shared-types';
import { ForbiddenError } from '../errors';
import type { RequestWithUser } from './auth.guard';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const role = request.user?.role;
    if (!role || !required.includes(role)) {
      throw new ForbiddenError();
    }
    return true;
  }
}