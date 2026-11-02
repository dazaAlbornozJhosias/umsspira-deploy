import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { UserReader } from '../../application/ports/user-reader.port';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { toActor } from '../translators/actor.translator';

@Injectable()
export class PrismaUserRepository implements UserReader {
  constructor(private readonly prisma: PrismaService) {}

  async findActor(userId: string): Promise<ActorContext | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { usuario_id: userId },
      select: {
        usuario_id: true,
        correo: true,
        nombre: true,
        rol: true,
        estado: true,
        cuenta_acceso: { select: { version: true } },
        empresa_registros: { select: { id: true } },
        empresa_usuario_registros: { where: { estado: 'activo' }, select: { id_empresa: true } },
        titulado: { select: { id: true } },
        administrador_de_carrera_registros: { select: { id_carrera: true, estado: true } },
      },
    });
    if (!user?.rol) {
      return null;
    }
    const role = await this.prisma.rolAcceso.findUnique({
      where: { codigo: user.rol },
      include: { permisos: { include: { permiso: true } } },
    });
    if (!role?.habilitado) {
      return null;
    }
    return toActor(
      user,
      role.permisos.filter((link) => link.permiso.habilitado).map((link) => link.permiso_codigo),
    );
  }
}
