import type { Client } from 'pg';
import type { PermissionSnapshot } from '../../scripts/seed/nlp-permissions';

/** Doble transaccional: nunca abre una conexión PostgreSQL. */
export function permissionDatabase(initial: PermissionSnapshot) {
  let state = structuredClone(initial);
  let before = structuredClone(initial);
  let readOnly = true;
  const query = jest.fn(async (sql: string, values: unknown[] = []) => {
    const text = sql.trim();
    if (text.startsWith('BEGIN')) {
      before = structuredClone(state);
      readOnly = text.endsWith('READ ONLY');
    } else if (text === 'ROLLBACK') {
      state = structuredClone(before);
    } else if (text.includes("current_setting('transaction_read_only')")) {
      return { rows: [{ read_only: readOnly ? 'on' : 'off' }], rowCount: 1 };
    } else if (text.startsWith('SELECT codigo, habilitado FROM public.rol_acceso')) {
      const wanted = values[0] as string[];
      return { rows: state.roles.filter((row) => wanted.includes(row.codigo)), rowCount: 2 };
    } else if (text.startsWith('SELECT codigo, habilitado FROM public.permiso_acceso')) {
      const wanted = values[0] as string[];
      return { rows: state.permissions.filter((row) => wanted.includes(row.codigo)), rowCount: 0 };
    } else if (text.startsWith('SELECT rol_codigo, permiso_codigo')) {
      return { rows: [...state.assignments], rowCount: state.assignments.length };
    } else if (text.startsWith('INSERT INTO public.permiso_acceso')) {
      if (readOnly) {
        throw new Error('escritura rechazada en READ ONLY');
      }
      const rows = (values[0] as string[])
        .filter((codigo) => !state.permissions.some((row) => row.codigo === codigo))
        .map((codigo) => ({ codigo, habilitado: true }));
      state.permissions.push(...rows);
      return { rows, rowCount: rows.length };
    } else if (text.startsWith('INSERT INTO public.rol_permiso')) {
      if (readOnly) {
        throw new Error('escritura rechazada en READ ONLY');
      }
      const roles = values[0] as string[];
      const permissions = values[1] as string[];
      const rows = roles.map((rol_codigo, i) => ({ rol_codigo, permiso_codigo: permissions[i] }));
      state.assignments.push(...rows);
      return { rows, rowCount: rows.length };
    } else if (text !== 'COMMIT') {
      throw new Error('consulta no prevista en el doble');
    }
    return { rows: [], rowCount: 0 };
  });
  return { query, snapshot: () => structuredClone(state), client: { query } as unknown as Pick<Client, 'query'> };
}
