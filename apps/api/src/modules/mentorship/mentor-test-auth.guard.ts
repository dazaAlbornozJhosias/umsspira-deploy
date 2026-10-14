import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@/shared/guards/auth.guard';

// Solo para desarrollo local con ENABLE_MENTOR_TEST_AUTH=true; nunca habilitar en producción.
const LOCAL_MENTOR_TEST_TOKEN = 'umsspira-local-mentor-test-only';
export const LOCAL_MENTOR_TEST_USER_ID = '00000000-0000-4000-8000-000000000006';

type MentorRequest = Request & { user?: { id?: string } };

/**
 * Guarda de los endpoints de mentoría.
 *
 * Acepta dos formas de identificarse:
 * 1. El token de prueba local (`ENABLE_MENTOR_TEST_AUTH=true`, solo fuera de
 *    producción): inyecta un usuario fijo para desarrollo y Postman.
 * 2. El token real del inicio de sesión (Supabase): lo valida con el guard de
 *    autenticación del proyecto, que deja `req.user.id` = usuario logueado.
 *
 * Sin esta segunda vía los endpoints respondían 401 a los usuarios reales,
 * porque nadie inyectaba `req.user.id` (ver TODO histórico del controlador).
 */
@Injectable()
export class MentorAuthGuard implements CanActivate {
  // AuthGuard es sin estado: se reutiliza tal cual para validar tokens reales.
  private readonly authGuard = new AuthGuard();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<MentorRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.ENABLE_MENTOR_TEST_AUTH === 'true' &&
      token === LOCAL_MENTOR_TEST_TOKEN
    ) {
      request.user = { id: LOCAL_MENTOR_TEST_USER_ID };
      return true;
    }

    if (request.user?.id) return true;

    await this.authGuard.canActivate(context);
    return true;
  }
}

/** @deprecated Usar MentorAuthGuard: ahora también acepta el token real del login. */
export const MentorTestAuthGuard = MentorAuthGuard;
export { LOCAL_MENTOR_TEST_TOKEN };
