import type { Client } from 'pg';

export const NLP_PERMISSIONS = ['nlp:extract', 'radar:self:read', 'radar:self:write'] as const;
export const NLP_ASSIGNMENTS = [
  { rol_codigo: 'administrador', permiso_codigo: 'nlp:extract' },
  { rol_codigo: 'titulado', permiso_codigo: 'nlp:extract' },
  { rol_codigo: 'titulado', permiso_codigo: 'radar:self:read' },
  { rol_codigo: 'titulado', permiso_codigo: 'radar:self:write' },
] as const;

export type PermissionMode = 'dry-run' | 'apply';
type Assignment = { rol_codigo: string; permiso_codigo: string };
type AccessRow = { codigo: string; habilitado: boolean };
export interface PermissionSnapshot {
  roles: AccessRow[];
  permissions: AccessRow[];
  assignments: Assignment[];
}

export function planNlpPermissions(snapshot: PermissionSnapshot) {
  const roles = ['administrador', 'titulado'];
  return {
    missingRoles: roles.filter((code) => !snapshot.roles.some((row) => row.codigo === code)),
    disabledRoles: snapshot.roles.filter((row) => !row.habilitado).map((row) => row.codigo),
    disabledPermissions: snapshot.permissions
      .filter((row) => !row.habilitado)
      .map((row) => row.codigo),
    missingPermissions: NLP_PERMISSIONS.filter(
      (code) => !snapshot.permissions.some((row) => row.codigo === code),
    ),
    missingAssignments: NLP_ASSIGNMENTS.filter(
      (expected) =>
        !snapshot.assignments.some(
          (row) =>
            row.rol_codigo === expected.rol_codigo &&
            row.permiso_codigo === expected.permiso_codigo,
        ),
    ),
  };
}

export class PermissionOperationError extends Error {
  constructor(readonly stage: string) {
    super(`Operación dirigida de permisos detenida en etapa: ${stage}`);
    this.name = 'PermissionOperationError';
  }
}

export function assertTeamPermissionTarget(value: string | undefined): asserts value is string {
  try {
    if (!value) {
      throw new Error();
    }
    const url = new URL(value);
    const ref = 'miiiuaynoxkhnngjjzvq';
    const direct = url.hostname === `db.${ref}.supabase.co`;
    const pooler =
      url.hostname.endsWith('.pooler.supabase.com') &&
      decodeURIComponent(url.username) === `postgres.${ref}`;
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || (!direct && !pooler)) {
      throw new Error();
    }
  } catch {
    throw new PermissionOperationError('destino: se requiere la copia del equipo');
  }
}

export function parsePermissionMode(args: string[]): PermissionMode {
  if (args.length === 0 || (args.length === 1 && args[0] === '--dry-run')) {
    return 'dry-run';
  }
  if (args.length === 1 && args[0] === '--apply') {
    return 'apply';
  }
  throw new PermissionOperationError('argumentos: usa --dry-run o --apply');
}

async function readSnapshot(client: Pick<Client, 'query'>, lock: boolean): Promise<PermissionSnapshot> {
  const suffix = lock ? ' FOR SHARE' : '';
  const roles = await client.query<AccessRow>(
    'SELECT codigo, habilitado FROM public.rol_acceso WHERE codigo = ANY($1::text[])' + suffix,
    [['administrador', 'titulado']],
  );
  const permissions = await client.query<AccessRow>(
    'SELECT codigo, habilitado FROM public.permiso_acceso WHERE codigo = ANY($1::text[])' + suffix,
    [[...NLP_PERMISSIONS]],
  );
  const assignments = await client.query<Assignment>(
    `SELECT rol_codigo, permiso_codigo FROM public.rol_permiso
     WHERE (rol_codigo = 'administrador' AND permiso_codigo = 'nlp:extract')
        OR (rol_codigo = 'titulado' AND permiso_codigo = ANY($1::text[]))`,
    [[...NLP_PERMISSIONS]],
  );
  return { roles: roles.rows, permissions: permissions.rows, assignments: assignments.rows };
}

/**
 * Recibe un cliente conectado. El dry-run usa READ ONLY real en PostgreSQL.
 * --apply es una única transacción; no modifica roles ni filas existentes.
 */
export async function runNlpPermissionOperation(
  client: Pick<Client, 'query'>,
  mode: PermissionMode = 'dry-run',
) {
  // Defensa también para callers JavaScript que no pasan por el parser CLI.
  if (mode !== 'dry-run' && mode !== 'apply') {
    throw new PermissionOperationError('modo no reconocido');
  }
  let stage = 'inicio de transacción';
  let started = false;
  try {
    await client.query(
      mode === 'dry-run'
        ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'
        : 'BEGIN ISOLATION LEVEL SERIALIZABLE READ WRITE',
    );
    started = true;
    stage = 'verificación de modo';
    const transaction = await client.query<{ read_only: string }>(
      "SELECT current_setting('transaction_read_only') AS read_only",
    );
    if (mode === 'dry-run' && transaction.rows[0]?.read_only !== 'on') {
      throw new PermissionOperationError(stage);
    }
    stage = 'lectura';
    const plan = planNlpPermissions(await readSnapshot(client, mode === 'apply'));
    const blocked =
      plan.missingRoles.length + plan.disabledRoles.length + plan.disabledPermissions.length > 0;
    let insertedPermissions = 0;
    let insertedAssignments = 0;

    if (mode === 'apply') {
      stage = 'validación de roles y permisos habilitados';
      if (blocked) {
        throw new PermissionOperationError(stage);
      }
      stage = 'inserción de permisos';
      if (plan.missingPermissions.length > 0) {
        const inserted = await client.query(
          `INSERT INTO public.permiso_acceso (codigo, habilitado)
           SELECT requested.codigo, true FROM unnest($1::text[]) AS requested(codigo)
           ON CONFLICT (codigo) DO NOTHING RETURNING codigo`,
          [plan.missingPermissions],
        );
        insertedPermissions = inserted.rowCount ?? 0;
      }
      stage = 'inserción de asignaciones';
      if (plan.missingAssignments.length > 0) {
        const inserted = await client.query(
          `INSERT INTO public.rol_permiso (rol_codigo, permiso_codigo)
           SELECT requested.rol_codigo, requested.permiso_codigo
           FROM unnest($1::text[], $2::text[]) AS requested(rol_codigo, permiso_codigo)
           ON CONFLICT (rol_codigo, permiso_codigo) DO NOTHING
           RETURNING rol_codigo, permiso_codigo`,
          [
            plan.missingAssignments.map((row) => row.rol_codigo),
            plan.missingAssignments.map((row) => row.permiso_codigo),
          ],
        );
        insertedAssignments = inserted.rowCount ?? 0;
      }
      stage = 'verificación posterior';
      const after = planNlpPermissions(await readSnapshot(client, true));
      if (
        after.missingPermissions.length ||
        after.missingAssignments.length ||
        after.missingRoles.length ||
        after.disabledPermissions.length ||
        after.disabledRoles.length
      ) {
        throw new PermissionOperationError(stage);
      }
    }
    stage = 'confirmación de transacción';
    await client.query('COMMIT');
    return { mode, blocked, plan, insertedPermissions, insertedAssignments };
  } catch (error) {
    if (started) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // No sustituir el diagnóstico de etapa ni imprimir el error del driver.
      }
    }
    throw error instanceof PermissionOperationError ? error : new PermissionOperationError(stage);
  }
}
