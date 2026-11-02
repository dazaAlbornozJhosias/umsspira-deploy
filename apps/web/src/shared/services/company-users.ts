import { apiFetch } from "@/shared/services/api-client";
import { getCurrentCompanyId } from "@/shared/services/companies";

export type RolEmpresa =
  | "Administrador"
  | "Reclutador";

export type EstadoUsuarioEmpresa =
  | "Pendiente"
  | "Activo"
  | "Inactivo";

export interface UsuarioEmpresa {
  id: string;
  nombre: string;
  correo: string;
  rol: RolEmpresa;
  estado: EstadoUsuarioEmpresa;
  id_usuario: string | null;
  esTitular?: boolean;
}

// Obtiene la ruta correspondiente a la empresa autenticada.
async function obtenerRutaBase(): Promise<string> {
  const companyId = await getCurrentCompanyId();

  if (!companyId) {
    throw new Error("No se encontró una empresa asociada a la sesión.");
  }

  return `/api/v1/companies/${companyId}/users`;
}

// Obtiene los colaboradores reales de la empresa.
export async function obtenerUsuariosEmpresa(): Promise<UsuarioEmpresa[]> {
  const ruta = await obtenerRutaBase();

  return apiFetch<UsuarioEmpresa[]>(ruta);
}

// Registra una invitación real mediante el backend.
export async function invitarUsuarioEmpresa(datos: {
  nombre: string;
  correo: string;
  rol: RolEmpresa;
}): Promise<UsuarioEmpresa> {
  const ruta = await obtenerRutaBase();

  return apiFetch<UsuarioEmpresa>(`${ruta}/invitations`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

// Permite modificar el rol o el estado de un colaborador.
export async function actualizarUsuarioEmpresa(
  usuarioId: string,
  datos: {
    rol?: RolEmpresa;
    estado?: "Activo" | "Inactivo";
  },
): Promise<UsuarioEmpresa> {
  const ruta = await obtenerRutaBase();

  return apiFetch<UsuarioEmpresa>(`${ruta}/${usuarioId}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

// Permite aceptar una invitación con un token.
export async function aceptarInvitacionEmpresa(
  token: string,
  password: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    "/api/v1/companies/invitations/accept",
    {
      method: "POST",
      body: JSON.stringify({
        token,
        password,
      }),
    },
  );
}
// Cancela una invitación que todavía no fue aceptada.
export async function cancelarInvitacionEmpresa(invitacionId: string): Promise<void> {
  const ruta = await obtenerRutaBase();
  await apiFetch<{ message: string }>(`${ruta}/invitations/${invitacionId}`, {
    method: "DELETE",
  });
}
