import { Injectable } from '@nestjs/common';
import { getSupabaseAuthClient } from '@/shared/lib/supabase';

@Injectable()
export class AuthRepository {
  /**
   * Único punto del módulo que habla con Supabase Auth.
   * Devuelve tal cual lo que responde Supabase (datos o error);
   * no decide si el login es válido, esa decisión es del Service.
   *
   * Usa el cliente DEDICADO a autenticación: el cliente de consultas a la BD
   * no debe quedarse con la sesión del usuario, porque supabase-js la adjuntaría
   * a las consultas siguientes y la BD se leería con los permisos del usuario
   * (RLS) en lugar de con los de servicio.
   */
  async signInWithPassword(email: string, password: string) {
    return getSupabaseAuthClient().auth.signInWithPassword({ email, password });
  }
}
