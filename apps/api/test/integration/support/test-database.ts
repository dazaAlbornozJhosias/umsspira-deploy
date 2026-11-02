import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';

/**
 * Base de datos PostgreSQL real, desechable, para las pruebas de integracion.
 *
 * Dos modos:
 *  1. TEST_DATABASE_URL (recomendado): apunta a un servidor PostgreSQL LOCAL (el contenedor
 *     `db` de docker-compose, el de Mirko o el servicio del CI). El test crea en ese servidor
 *     una base temporal nueva y la borra al terminar. Nunca escribe datos en la base de la URL,
 *     asi que no se ensucia la de desarrollo. Se rechazan servidores que no sean locales.
 *  2. Sin TEST_DATABASE_URL, intenta levantar un contenedor con Testcontainers. Es opcional:
 *     solo funciona si el paquete @testcontainers/postgresql esta instalado y Docker abierto.
 *
 * En ambos casos aplica TODAS las migraciones de prisma/migrations, en orden, sobre la base
 * vacia. Por eso los CHECK y UNIQUE que se prueban son los reales de la migracion M1.
 */
export interface TestDatabase {
  connectionString: string;
  stop: () => Promise<void>;
}

const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'prisma', 'migrations');

export async function applyMigrations(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString });
  try {
    const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const dir of dirs) {
      const file = join(MIGRATIONS_DIR, dir, 'migration.sql');
      if (!existsSync(file)) {continue;}
      try {
        await pool.query(readFileSync(file, 'utf8'));
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Fallo la migracion ${dir}: ${reason}`);
      }
    }
  } finally {
    await pool.end();
  }
}

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]'];

function assertLocalServer(serverUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(serverUrl);
  } catch {
    throw new Error('TEST_DATABASE_URL no es una URL valida (postgres://usuario:clave@127.0.0.1:5432/postgres).');
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !LOCAL_HOSTS.includes(parsed.hostname)) {
    throw new Error(
      `Destino rechazado (${parsed.hostname}): las pruebas de integracion solo corren contra un PostgreSQL local.`,
    );
  }
}

async function startOnExistingServer(serverUrl: string): Promise<TestDatabase> {
  assertLocalServer(serverUrl);
  const name = `radar_it_${randomBytes(4).toString('hex')}`;
  const admin = new Pool({ connectionString: serverUrl });
  await admin.query(`CREATE DATABASE "${name}"`);
  await admin.end();

  const connectionString = withDatabase(serverUrl, name);
  try {
    await applyMigrations(connectionString);
  } catch (error) {
    await dropDatabase(serverUrl, name);
    throw error;
  }

  return {
    connectionString,
    stop: () => dropDatabase(serverUrl, name),
  };
}

async function dropDatabase(serverUrl: string, name: string): Promise<void> {
  const admin = new Pool({ connectionString: serverUrl });
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}

interface ContainerLike {
  getConnectionUri(): string;
  stop(): Promise<unknown>;
}

async function startWithTestcontainers(): Promise<TestDatabase> {
  // Nombre en variable a proposito: el paquete es opcional y no debe romper la compilacion si falta.
  const moduleName = '@testcontainers/postgresql';
  let PostgreSqlContainer: new (image?: string) => { start(): Promise<ContainerLike> };
  try {
    ({ PostgreSqlContainer } = await import(moduleName));
  } catch {
    throw new Error(
      'Falta TEST_DATABASE_URL. Define la URL de un PostgreSQL local, por ejemplo ' +
        '$env:TEST_DATABASE_URL="postgres://postgres:umsspira_local@127.0.0.1:5432/postgres" ' +
        '(o instala @testcontainers/postgresql para que el test levante su propio contenedor).',
    );
  }

  const container = await new PostgreSqlContainer('postgres:15-alpine').start();
  const connectionString = container.getConnectionUri();
  try {
    await applyMigrations(connectionString);
  } catch (error) {
    await container.stop();
    throw error;
  }
  return { connectionString, stop: async () => void (await container.stop()) };
}

export async function startTestDatabase(): Promise<TestDatabase> {
  const serverUrl = process.env.TEST_DATABASE_URL;
  return serverUrl ? startOnExistingServer(serverUrl) : startWithTestcontainers();
}
