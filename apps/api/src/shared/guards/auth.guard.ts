// apps/api/src/shared/guards/auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '@umsspira/shared-types';
import { UnauthorizedError } from '../errors';
import { getSupabaseAuthClient } from '../lib/supabase';
import { resolveUserRole } from './user-roles';

export type RequestWithUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
};

const SESSION_REQUIRED = 'Debes iniciar sesión para continuar';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedError(SESSION_REQUIRED);
    }

    // Supabase valida firma, vigencia y que la cuenta siga existiendo.
    // Cliente dedicado a autenticación: la validación no debe tocar el cliente
    // de consultas de la BD (ver shared/lib/supabase.ts).
    const { data, error } = await getSupabaseAuthClient().auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedError(SESSION_REQUIRED);
    }

    const role = resolveUserRole(data.user);
    if (!role) {
      throw new UnauthorizedError(SESSION_REQUIRED);
    }

    request.user = { id: data.user.id, email: data.user.email ?? '', role };
    return true;
  }

  private extractToken(request: RequestWithUser): string | null {
    const header = request.headers.authorization;
    if (typeof header !== 'string') return null;

    const [scheme, token] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
  }
}