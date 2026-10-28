import {
  assertTeamPermissionTarget,
  NLP_ASSIGNMENTS,
  NLP_PERMISSIONS,
  parsePermissionMode,
  planNlpPermissions,
  runNlpPermissionOperation,
  type PermissionSnapshot,
} from '../scripts/seed/nlp-permissions';
import { permissionDatabase } from './adapters/in-memory-permission-database';

function empty(): PermissionSnapshot {
  return {
    roles: [
      { codigo: 'administrador', habilitado: true },
      { codigo: 'titulado', habilitado: true },
    ],
    permissions: [],
    assignments: [],
  };
}

describe('Alta dirigida de permisos — N29', () => {
  it('usa dry-run por defecto y rechaza argumentos ambiguos o desconocidos', () => {
    expect(parsePermissionMode([])).toBe('dry-run');
    expect(parsePermissionMode(['--dry-run'])).toBe('dry-run');
    expect(parsePermissionMode(['--apply'])).toBe('apply');
    expect(() => parsePermissionMode(['--apply', '--dry-run'])).toThrow('argumentos');
    expect(() => parsePermissionMode(['--aply'])).toThrow('argumentos');
  });

  it('solo acepta el proyecto del equipo y no refleja el valor rechazado', () => {
    const team = 'miiiuaynoxkhnngjjzvq';
    expect(() => assertTeamPermissionTarget(`postgresql://postgres.${team}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`)).not.toThrow();
    expect(() => assertTeamPermissionTarget(`postgresql://postgres@db.${team}.supabase.co/postgres`)).not.toThrow();
    for (const value of [undefined, 'valor-privado', 'postgresql://postgres.otro@aws-1-sa-east-1.pooler.supabase.com/postgres']) {
      expect(() => assertTeamPermissionTarget(value)).toThrow('destino');
    }
  });

  it('calcula exactamente tres permisos y cuatro asociaciones', () => {
    const plan = planNlpPermissions(empty());
    expect(plan.missingPermissions).toEqual([...NLP_PERMISSIONS]);
    expect(plan.missingAssignments).toEqual([...NLP_ASSIGNMENTS]);
  });

  it('el modo predeterminado inicia READ ONLY y nunca intenta insertar', async () => {
    const initial = empty();
    const db = permissionDatabase(initial);
    const result = await runNlpPermissionOperation(db.client);
    expect(result.mode).toBe('dry-run');
    expect(result.insertedPermissions).toBe(0);
    expect(result.insertedAssignments).toBe(0);
    expect(db.snapshot()).toEqual(initial);
    expect(db.query.mock.calls[0][0]).toContain('READ ONLY');
    expect(db.query.mock.calls.some(([sql]) => /INSERT|UPDATE|DELETE/.test(sql))).toBe(false);
  });

  it('aplica solo el conjunto dirigido, conserva asociaciones ajenas y repetir no escribe', async () => {
    const initial = empty();
    initial.permissions.push({ codigo: 'eventos:read', habilitado: false });
    initial.assignments.push({ rol_codigo: 'empresa', permiso_codigo: 'eventos:read' });
    const db = permissionDatabase(initial);
    const first = await runNlpPermissionOperation(db.client, 'apply');
    expect(first.insertedPermissions).toBe(3);
    expect(first.insertedAssignments).toBe(4);
    const after = db.snapshot();
    const second = await runNlpPermissionOperation(db.client, 'apply');
    expect(second.insertedPermissions).toBe(0);
    expect(second.insertedAssignments).toBe(0);
    expect(db.snapshot()).toEqual(after);
    expect(after.permissions.find((row) => row.codigo === 'eventos:read')?.habilitado).toBe(false);
    expect(after.assignments).toContainEqual(initial.assignments[0]);
    expect(after.assignments).not.toContainEqual({ rol_codigo: 'titulado', permiso_codigo: 'eventos:read' });
  });

  it.each(['rol ausente', 'rol deshabilitado', 'permiso deshabilitado'])(
    'detiene apply sin reactivar ni insertar cuando hay %s',
    async (caseName) => {
      const initial = empty();
      if (caseName === 'rol ausente') {
        initial.roles.pop();
      } else if (caseName === 'rol deshabilitado') {
        initial.roles[0].habilitado = false;
      } else {
        initial.permissions.push({ codigo: 'nlp:extract', habilitado: false });
      }
      const db = permissionDatabase(initial);
      expect((await runNlpPermissionOperation(db.client)).blocked).toBe(true);
      await expect(runNlpPermissionOperation(db.client, 'apply')).rejects.toThrow('validación');
      expect(db.snapshot()).toEqual(initial);
      expect(db.query.mock.calls.some(([sql]) => sql.includes('INSERT'))).toBe(false);
    },
  );

  it('revierte permisos ya insertados si falla la etapa de asignaciones', async () => {
    const initial = empty();
    const db = permissionDatabase(initial);
    const implementation = db.query.getMockImplementation()!;
    db.query.mockImplementation(async (sql, values) => {
      if (sql.includes('INSERT INTO public.rol_permiso')) {
        throw new Error('detalle privado del driver');
      }
      return implementation(sql, values);
    });
    await expect(runNlpPermissionOperation(db.client, 'apply')).rejects.toThrow('asignaciones');
    expect(db.query.mock.calls.some(([sql]) => sql.includes('INSERT INTO public.permiso_acceso'))).toBe(true);
    expect(db.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(db.snapshot()).toEqual(initial);
  });

  it('no ejecuta consultas para un modo inválido', async () => {
    const db = permissionDatabase(empty());
    await expect(runNlpPermissionOperation(db.client, 'otro' as 'apply')).rejects.toThrow('modo');
    expect(db.query).not.toHaveBeenCalled();
  });
});
