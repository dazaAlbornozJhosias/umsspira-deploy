// apps/api/src/modules/auth/services/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { UnauthorizedError } from '@/shared/errors';
import { resolveUserRole } from '@/shared/guards/user-roles';
import type { LoginInput, LoginResponse } from '@umsspira/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly repo: AuthRepository) {}

  async login(input: LoginInput): Promise<LoginResponse> {
    const { data, error } = await this.repo.signInWithPassword(input.email, input.password);

    if (error || !data.session || !data.user) {
      // Solo en el log del servidor: al cliente siempre le llega el mensaje genérico
      this.logger.warn(
        `Login rechazado por Supabase: ${error?.code ?? error?.message ?? 'sin sesión'}`,
      );
      throw new UnauthorizedError();
    }

    const role = resolveUserRole(data.user);
    if (!role) {
      this.logger.warn('Login rechazado: rol inválido o ausente en app_metadata/user_metadata');
      throw new UnauthorizedError();
    }

    return { accessToken: data.session.access_token, role };
  }
}