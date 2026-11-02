import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import { Client } from 'pg';

// Opt-in explícito. Solo ejecuta SELECT sobre information_schema dentro de una
// transaccion READ ONLY: no lee ni escribe datos de negocio.
const integration =
  process.env.RUN_RADAR_JSONB_READONLY_TEST === 'true' ? describe : describe.skip;

integration('Radar HU-8: persistencia de solo lectura', () => {
  it('afinidad_radar.palabras_clave_top existe como JSONB nullable', async () => {
    // No usa process.env.DIRECT_URL: test/setup.ts la sustituye por una conexion ficticia.
    const file = parse(readFileSync(resolve(__dirname, '../.env')));
    const connectionString = file.DIRECT_URL;

    if (!connectionString) {
      throw new Error('Falta DIRECT_URL en apps/api/.env');
    }

    const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });

    try {
      await client.connect();
    } catch {
      throw new Error(
        'No se pudo conectar para verificar afinidad_radar; revisar configuracion local.',
      );
    }

    try {
      await client.query('BEGIN TRANSACTION READ ONLY');
      const { rows } = await client.query(
        `SELECT data_type, is_nullable
           FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'afinidad_radar'
            AND column_name = 'palabras_clave_top'`,
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ data_type: 'jsonb', is_nullable: 'YES' });
      await client.query('ROLLBACK');
    } finally {
      await client.end();
    }
  }, 20000);
});
