import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { UserDirectory } from '../../application/ports/user-directory.port';

@Injectable()
export class PrismaUserDirectory implements UserDirectory {
  constructor(private readonly prisma: PrismaService) {}

  private async roles() {
    return (
      await this.prisma.rolAcceso.findMany({
        where: { habilitado: true },
        select: { codigo: true },
      })
    ).map((role) => role.codigo);
  }

  async search(excludeId: string, query: string, page: number) {
    const users = await this.prisma.usuario.findMany({
      where: {
        usuario_id: { not: excludeId },
        estado: 'ACTIVO',
        cuenta_acceso: { isNot: null },
        rol: { in: await this.roles() },
        nombre: { contains: query, mode: 'insensitive' },
      },
      select: { usuario_id: true, nombre: true, rol: true },
      orderBy: [{ nombre: 'asc' }, { usuario_id: 'asc' }],
      skip: (page - 1) * 20,
      take: 21,
    });
    return users.map((user) => ({
      id: user.usuario_id,
      name: user.nombre ?? 'Usuario',
      role: user.rol ?? '',
    }));
  }

  async findActive(id: string) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        usuario_id: id,
        estado: 'ACTIVO',
        cuenta_acceso: { isNot: null },
        rol: { in: await this.roles() },
      },
      select: { usuario_id: true, nombre: true, rol: true },
    });
    return user
      ? { id: user.usuario_id, name: user.nombre ?? 'Usuario', role: user.rol ?? '' }
      : null;
  }
}
