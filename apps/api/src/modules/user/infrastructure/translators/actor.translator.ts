import {
  USER_ROLES,
  type ActorContext,
  type UserRole,
} from '../../../../shared/security/contexts/actor-context';

export interface ActorRecord {
  usuario_id: string;
  correo: string | null;
  nombre: string | null;
  rol: string | null;
  estado: string;
  cuenta_acceso: { version: number } | null;
  empresa_registros: { id: string }[];
  titulado: { id: string } | null;
  administrador_de_carrera_registros: { id_carrera: string | null; estado: string | null }[];
}

export function toActor(record: ActorRecord, permissions: string[]): ActorContext | null {
  if (
    record.estado !== 'ACTIVO' ||
    !record.correo ||
    !record.cuenta_acceso ||
    !USER_ROLES.includes(record.rol as UserRole)
  ) {
    return null;
  }
  return {
    id: record.usuario_id,
    email: record.correo,
    name: record.nombre,
    role: record.rol as UserRole,
    permissions,
    credentialVersion: record.cuenta_acceso.version,
    scopes: {
      companyIds: record.empresa_registros.map((company) => company.id),
      graduateId: record.titulado?.id ?? null,
      careerIds: [
        ...new Set(
          record.administrador_de_carrera_registros
            .filter((assignment) => assignment.estado?.toUpperCase() === 'ACTIVO')
            .flatMap((assignment) => (assignment.id_carrera ? [assignment.id_carrera] : [])),
        ),
      ],
    },
  };
}
