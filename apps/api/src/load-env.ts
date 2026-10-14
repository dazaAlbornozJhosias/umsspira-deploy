import { config } from 'dotenv';
import { resolve } from 'path';

// Conserva la selección del stack local y la búsqueda del entorno de epic1.
const usarStackLocal = process.env.SUPABASE_ENV === 'local';
config({
  path: usarStackLocal
    ? resolve(process.cwd(), '.env.localstack')
    : ['.env', '../../.env'],
  override: usarStackLocal,
  quiet: true,
});
