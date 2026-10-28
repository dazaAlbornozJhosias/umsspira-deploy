import type { PrismaClient } from '../../src/generated/prisma/client';
import { ROLE_PERMISSIONS } from '../../src/modules/user/domain/policies/access.policy';

export async function seedAccessCatalog(prisma: PrismaClient): Promise<void> {
  const roles = Object.keys(ROLE_PERMISSIONS);
  const permissions = [...new Set(Object.values(ROLE_PERMISSIONS).flat())];
  const assignments = Object.entries(ROLE_PERMISSIONS).flatMap(([role, codes]) =>
    codes.map((permission) => ({ rol_codigo: role, permiso_codigo: permission })),
  );

  await prisma.$transaction([
    prisma.rolAcceso.createMany({
      data: roles.map((codigo) => ({ codigo })),
      skipDuplicates: true,
    }),
    prisma.permisoAcceso.createMany({
      data: permissions.map((codigo) => ({ codigo })),
      skipDuplicates: true,
    }),
    prisma.rolPermiso.createMany({
      data: assignments,
      skipDuplicates: true,
    }),
  ]);
}
