import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

// Supabase exige SSL; el Postgres local de docker-compose no lo tiene.
// DATABASE_SSL=false lo apaga a mano (por ejemplo, para otro Postgres sin SSL).
function configuracionSsl(connectionString: string): PoolConfig['ssl'] {
  const esLocal = /@(localhost|127\.0\.0\.1|db)(:|\/)/.test(connectionString);
  if (process.env.DATABASE_SSL === 'false' || esLocal) {
    return false;
  }
  // El certificado de Supabase no está en la lista de CA de Node: se cifra igual, sin validar la cadena
  return { rejectUnauthorized: false };
}

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL no esta definida en el entorno');
    }
    // sslmode de la URL pisaría la opción ssl de abajo, así que se quita y se decide aquí
    const sinSslMode = connectionString.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
    pool = new Pool({ connectionString: sinSslMode, ssl: configuracionSsl(sinSslMode) });
  }
  return pool;
}


export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}
