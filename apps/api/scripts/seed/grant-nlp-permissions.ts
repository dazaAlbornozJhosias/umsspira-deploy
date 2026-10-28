import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Client } from 'pg';
import {
  assertTeamPermissionTarget,
  parsePermissionMode,
  PermissionOperationError,
  runNlpPermissionOperation,
} from './nlp-permissions';

export async function grantNlpPermissions(args: string[] = process.argv.slice(2)): Promise<void> {
  const mode = parsePermissionMode(args);
  config({ path: resolve(__dirname, '../../.env'), quiet: true });
  const connectionString = process.env.DIRECT_URL;
  assertTeamPermissionTarget(connectionString);
  // Evitar que una segunda variable existente apunte inadvertidamente a otra base.
  if (process.env.DATABASE_URL) {
    assertTeamPermissionTarget(process.env.DATABASE_URL);
  }
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const result = await runNlpPermissionOperation(client, mode);
    console.info(JSON.stringify({ target: 'um***-dev', host: '***', ...result }, null, 2));
    if (result.blocked) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  void grantNlpPermissions().catch((error: unknown) => {
    console.error(
      error instanceof PermissionOperationError
        ? error.message
        : 'No se pudo completar la operación dirigida; revisa conexión y configuración local.',
    );
    process.exitCode = 1;
  });
}
