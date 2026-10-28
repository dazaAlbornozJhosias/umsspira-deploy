import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';
import { Client } from 'pg';
import { assertTeamPermissionTarget, runNlpPermissionOperation } from '../scripts/seed/nlp-permissions';

// Opt-in explícito: usa solo SELECT y una transacción READ ONLY contra la copia.
// No usa process.env.DIRECT_URL: test/setup.ts la sustituye por la conexión ficticia.
const integration = process.env.RUN_NLP_PERMISSIONS_READONLY_TEST === 'true' ? describe : describe.skip;

integration('Permisos: integración PostgreSQL de solo lectura', () => {
  it('dry-run funciona con RLS y no cambia permisos ni asociaciones', async () => {
    const file = parse(readFileSync(resolve(__dirname, '../.env')));
    assertTeamPermissionTarget(file.DIRECT_URL);
    if (file.DATABASE_URL) {
      assertTeamPermissionTarget(file.DATABASE_URL);
    }
    const client = new Client({ connectionString: file.DIRECT_URL, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      const snapshot = async () => (await client.query(
        `SELECT json_build_object(
          'roles', (SELECT json_agg(r ORDER BY codigo) FROM public.rol_acceso r),
          'permissions', (SELECT json_agg(p ORDER BY codigo) FROM public.permiso_acceso p),
          'assignments', (SELECT json_agg(a ORDER BY rol_codigo, permiso_codigo) FROM public.rol_permiso a)
        ) AS state`,
      )).rows[0].state;
      const before = await snapshot();
      const result = await runNlpPermissionOperation(client);
      expect(result.mode).toBe('dry-run');
      expect(result.insertedPermissions).toBe(0);
      expect(result.insertedAssignments).toBe(0);
      expect(await snapshot()).toEqual(before);
    } catch {
      // No dejar que Jest imprima objetos del driver con detalles de conexión.
      throw new Error('Falló integración PostgreSQL de solo lectura; revisar conectividad/configuración.');
    } finally {
      await client.end();
    }
  }, 20000);
});
