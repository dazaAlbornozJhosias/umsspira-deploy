import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

// Cliente con la clave anonima (respeta RLS). Lo usan autenticacion y guardas.
export function getSupabase(): SupabaseClient {
  if (anonClient) return anonClient;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_ANON_KEY. Revisa tu archivo .env',
    );
  }

  anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anonClient;
}

// Error propio para distinguir una configuracion incompleta de un fallo de Supabase.
export class SupabaseConfigError extends Error {
  constructor() {
    super(
      'Faltan las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY',
    );
    this.name = 'SupabaseConfigError';
  }
}

/**
 * Cliente para el backend con la clave de servicio (no pasa por RLS).
 * Conserva la clave de servicio requerida por dev. Se crea bajo demanda
 * para no detener la API al importar el archivo.
 */
export function getSupabaseClient(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new SupabaseConfigError();
  }

  serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}

/**
 * Cliente DEDICADO a autenticación (inicio de sesión y validación de tokens).
 * Jamás usarlo para consultas a tablas: supabase-js guarda la sesión del
 * usuario en memoria y la adjunta como Authorization a las consultas
 * siguientes del MISMO cliente, con lo que la BD se leería con los permisos
 * del usuario (RLS) y tablas sin política de lectura (carrera, mentor)
 * volverían vacías. Las consultas a tablas usan getSupabaseClient().
 */
let authClient: SupabaseClient | null = null;

export function getSupabaseAuthClient(): SupabaseClient {
  if (authClient) return authClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new SupabaseConfigError();
  }

  authClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return authClient;
}

/**
 * Acceso compatible con `supabase.from(...)` (forma usada por otros modulos del monorepo).
 * Delega en getSupabaseClient(), por lo que tampoco detiene la API al importar el archivo.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});


// Alias para el módulo de perfil (usa supabaseClient().storage...): es el mismo cliente compartido
export function supabaseClient(): SupabaseClient {
  return supabase;
}
