import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessError } from '../../../security/errors/access-error';
import type { UserRole } from '../../../security/contexts/actor-context';
import { PUBLIC_ROUTE } from '../decorators/public.decorator';
import { REQUIRED_PERMISSIONS } from '../decorators/require-permissions.decorator';
import { REQUIRED_ROLES } from '../decorators/roles.decorator';
import type { AuthRequest } from '../contracts/auth-request';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, targets)) {
      return true;
    }
    const actor = context.switchToHttp().getRequest<AuthRequest>().auth?.actor;
    if (!actor) {
      throw new AccessError('UNAUTHENTICATED');
    }
    const permissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, targets) ?? [];
    const roles = this.reflector.getAllAndOverride<UserRole[]>(REQUIRED_ROLES, targets) ?? [];
    if (
      !permissions.every((permission) => actor.permissions.includes(permission)) ||
      (roles.length > 0 && !roles.includes(actor.role))
    ) {
      throw new AccessError('FORBIDDEN');
    }
    return true;
  }
}
