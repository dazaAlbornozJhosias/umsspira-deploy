import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../shared/infrastructure/database/prisma.service';
import type { ActorContext } from '../../shared/security/contexts/actor-context';
import type { ActualizarUsuarioDto } from './company-users.controller';

type RolBD = 'administrador' | 'reclutador';
type EstadoBD = 'activo' | 'inactivo';

interface EmpresaRow {
  id: string;
  id_usuario: string | null;
}

interface MiembroRow {
  id: string;
  id_usuario: string;
  nombre: string | null;
  correo: string | null;
  rol: string;
  estado: string;
}

interface InvitacionRow {
  id: string;
  nombre: string | null;
  correo: string;
  rol: string;
  estado: string;
}

interface UsuarioEmpresaResponse {
  id: string;
  id_usuario: string | null;
  nombre: string;
  correo: string;
  rol: 'Administrador' | 'Reclutador';
  estado: 'Pendiente' | 'Activo' | 'Inactivo';
  esTitular: boolean;
}

@Injectable()
export class CompanyUsersService {
  constructor(private readonly prisma: PrismaService) {}

  private convertirRol(rol: string): RolBD {
    if (rol?.toLowerCase() === 'administrador') {
      return 'administrador';
    }
    if (rol?.toLowerCase() === 'reclutador') {
      return 'reclutador';
    }
    throw new BadRequestException('El rol debe ser Administrador o Reclutador');
  }

  private mostrarRol(rol: string): 'Administrador' | 'Reclutador' {
    return rol.toLowerCase() === 'administrador' ? 'Administrador' : 'Reclutador';
  }

  private mostrarEstado(estado: string): 'Activo' | 'Inactivo' {
    return estado === 'activo' ? 'Activo' : 'Inactivo';
  }

  private async verificarAdministrador(
    actor: ActorContext,
    companyId: string,
  ): Promise<EmpresaRow> {
    if (actor.role !== 'empresa' || !actor.scopes.companyIds.includes(companyId)) {
      throw new ForbiddenException('No tienes acceso a esta empresa');
    }

    const empresas = await this.prisma.$queryRaw<EmpresaRow[]>`
      SELECT id, id_usuario
      FROM empresa
      WHERE id = ${companyId}::uuid
      LIMIT 1
    `;

    const empresa = empresas[0];

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    if (empresa.id_usuario === actor.id) {
      return empresa;
    }

    const administradores = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM empresa_usuario
      WHERE id_empresa = ${companyId}::uuid
        AND id_usuario = ${actor.id}::uuid
        AND rol = 'administrador'
        AND estado = 'activo'
      LIMIT 1
    `;

    if (administradores.length === 0) {
      throw new ForbiddenException('Solo un administrador puede gestionar usuarios');
    }

    return empresa;
  }

  // LISTAR COLABORADORES E INVITACIONES
  async listarUsuarios(actor: ActorContext, companyId: string): Promise<UsuarioEmpresaResponse[]> {
    const empresa = await this.verificarAdministrador(actor, companyId);

    const miembros = await this.prisma.$queryRaw<MiembroRow[]>`
      SELECT
        eu.id,
        eu.id_usuario,
        u.nombre,
        u.correo,
        eu.rol,
        eu.estado
      FROM empresa_usuario eu
      INNER JOIN usuario u
        ON u.usuario_id = eu.id_usuario
      WHERE eu.id_empresa = ${companyId}::uuid
      ORDER BY eu.fecha_asignacion DESC
    `;

    const usuarios: UsuarioEmpresaResponse[] = miembros.map((m) => ({
      id: m.id,
      id_usuario: m.id_usuario,
      nombre: m.nombre?.trim() || 'Sin nombre',
      correo: m.correo ?? '',
      rol: this.mostrarRol(m.rol),
      estado: this.mostrarEstado(m.estado),
      esTitular: m.id_usuario === empresa.id_usuario,
    }));

    // Incluir titular de empresa cuando no sea miembro registrado.
    if (empresa.id_usuario && !usuarios.some((u) => u.id_usuario === empresa.id_usuario)) {
      const titulares = await this.prisma.$queryRaw<
        {
          usuario_id: string;
          nombre: string | null;
          correo: string | null;
        }[]
      >`
        SELECT usuario_id, nombre, correo
        FROM usuario
        WHERE usuario_id = ${empresa.id_usuario}::uuid
        LIMIT 1
      `;

      const titular = titulares[0];

      if (titular) {
        usuarios.unshift({
          id: titular.usuario_id,
          id_usuario: titular.usuario_id,
          nombre: titular.nombre?.trim() || 'Titular de empresa',
          correo: titular.correo ?? '',
          rol: 'Administrador',
          estado: 'Activo',
          esTitular: true,
        });
      }
    }

    // Leer el nombre real de cada invitación.
    const invitaciones = await this.prisma.$queryRaw<InvitacionRow[]>`
      SELECT id, nombre, correo, rol, estado
      FROM empresa_invitacion
      WHERE id_empresa = ${companyId}::uuid
        AND estado = 'pendiente'
        AND expira_en > NOW()
      ORDER BY creado_en DESC
    `;

    for (const invitacion of invitaciones) {
      usuarios.push({
        id: invitacion.id,
        id_usuario: null,
        nombre: invitacion.nombre?.trim() || invitacion.correo.split('@')[0],
        correo: invitacion.correo,
        rol: this.mostrarRol(invitacion.rol),
        estado: 'Pendiente',
        esTitular: false,
      });
    }

    return usuarios;
  }

  // ACTUALIZAR ROL O ESTADO
  async actualizarUsuario(
    actor: ActorContext,
    companyId: string,
    memberId: string,
    datos: ActualizarUsuarioDto,
  ): Promise<UsuarioEmpresaResponse> {
    const empresa = await this.verificarAdministrador(actor, companyId);

    if (!datos.rol && !datos.estado) {
      throw new BadRequestException('Indica un rol o estado');
    }

    const miembros = await this.prisma.$queryRaw<MiembroRow[]>`
      SELECT
        eu.id,
        eu.id_usuario,
        u.nombre,
        u.correo,
        eu.rol,
        eu.estado
      FROM empresa_usuario eu
      INNER JOIN usuario u
        ON u.usuario_id = eu.id_usuario
      WHERE eu.id = ${memberId}::uuid
        AND eu.id_empresa = ${companyId}::uuid
      LIMIT 1
    `;

    const miembro = miembros[0];

    if (!miembro) {
      throw new NotFoundException('Colaborador no encontrado');
    }

    if (miembro.id_usuario === empresa.id_usuario) {
      throw new ForbiddenException('No se puede modificar al titular de la empresa');
    }

    const nuevoRol = datos.rol ? this.convertirRol(datos.rol) : this.convertirRol(miembro.rol);

    let nuevoEstado: EstadoBD;

    if (datos.estado === 'Activo') {
      nuevoEstado = 'activo';
    } else if (datos.estado === 'Inactivo') {
      nuevoEstado = 'inactivo';
    } else if (datos.estado === undefined) {
      nuevoEstado = miembro.estado as EstadoBD;
    } else {
      throw new BadRequestException('Estado no válido');
    }

    if (
      miembro.id_usuario === actor.id &&
      (nuevoRol !== 'administrador' || nuevoEstado !== 'activo')
    ) {
      throw new ForbiddenException('No puedes quitarte tus propios permisos');
    }

    const actualizados = await this.prisma.$queryRaw<{ id: string; rol: string; estado: string }[]>`
      UPDATE empresa_usuario
      SET
        rol = ${nuevoRol},
        estado = ${nuevoEstado},
        fecha_desactivacion =
          CASE
            WHEN ${nuevoEstado} = 'inactivo'
              THEN COALESCE(fecha_desactivacion, NOW())
            ELSE NULL
          END
      WHERE id = ${memberId}::uuid
        AND id_empresa = ${companyId}::uuid
      RETURNING id, rol, estado
    `;

    const actualizado = actualizados[0];

    if (!actualizado) {
      throw new NotFoundException('No se pudo actualizar el usuario');
    }

    return {
      id: actualizado.id,
      id_usuario: miembro.id_usuario,
      nombre: miembro.nombre?.trim() || 'Sin nombre',
      correo: miembro.correo ?? '',
      rol: this.mostrarRol(actualizado.rol),
      estado: this.mostrarEstado(actualizado.estado),
      esTitular: false,
    };
  }

  // CANCELAR INVITACIÓN PENDIENTE
  async cancelarInvitacion(
    actor: ActorContext,
    companyId: string,
    invitationId: string,
  ): Promise<void> {
    await this.verificarAdministrador(actor, companyId);

    const canceladas = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE empresa_invitacion
      SET estado = 'cancelada'
      WHERE id = ${invitationId}::uuid
        AND id_empresa = ${companyId}::uuid
        AND estado = 'pendiente'
      RETURNING id
    `;

    if (canceladas.length === 0) {
      throw new NotFoundException('No se encontró una invitación pendiente');
    }
  }
}
