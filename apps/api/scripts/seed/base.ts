import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import type { PasswordHasher } from '../../src/modules/auth/application/ports/password-hasher.port';
import { Argon2PasswordHasher } from '../../src/modules/auth/infrastructure/security/argon2-password.hasher';
import { seedCatalogs } from './catalogs';
import {
  DEMO_ACCOUNTS,
  DEMO_CAREER_ID,
  DEMO_COMPANY_ID,
  DEMO_GRADUATE_ID,
  type DemoAccount,
} from './demo-accounts';

function profileFor(account: DemoAccount): Partial<Prisma.UsuarioCreateInput> {
  if (account.role === 'titulado') {
    return {
      titulado: {
        create: {
          id: account.profileId,
          nombre: account.name,
          ...(account.profileId === DEMO_GRADUATE_ID
            ? {
                apellido: 'UMSSPIRA',
                ci: '9000001',
                cod_sis: '202000001',
                anio_ingreso: 2020,
                anio_egreso: 2025,
                grado: 'Licenciatura',
                expedido_en: 'CB' as const,
              }
            : {}),
          carrera: { connect: { id: account.careerId ?? DEMO_CAREER_ID } },
        },
      },
    };
  }
  if (account.role === 'empresa') {
    return {
      empresa_registros: {
        create: {
          id: account.profileId,
          razon_social: account.name,
          correo: account.email,
          ...(account.profileId === DEMO_COMPANY_ID ? { nit: '900000001' } : {}),
          descripcion: 'Empresa ficticia para probar el portal de empleadores.',
          descripcion_larga: 'Ejemplo de empresa de desarrollo de software y análisis de datos.',
          eslogan: 'Aprender construyendo',
          tamano_empresa: '11-50',
          fecha_registro: new Date(),
        },
      },
    };
  }
  return {
    administrador_de_carrera_registros: {
      create: {
        id: account.profileId,
        estado: 'ACTIVO',
        carrera: { connect: { id: account.careerId ?? DEMO_CAREER_ID } },
      },
    },
  };
}

export async function seedBase(
  prisma: PrismaClient,
  passwords: Pick<PasswordHasher, 'hash'> = new Argon2PasswordHasher(),
): Promise<void> {
  await seedCatalogs(prisma);

  const roleCodes = [...new Set(DEMO_ACCOUNTS.map((account) => account.role))];
  const roles = await prisma.rolAcceso.findMany({
    where: { codigo: { in: roleCodes }, habilitado: true },
    select: { codigo: true },
  });
  if (roles.length !== roleCodes.length) {
    throw new Error('Hay roles de demostración deshabilitados');
  }

  for (const account of DEMO_ACCOUNTS) {
    const existing = await prisma.usuario.findUnique({
      where: { correo: account.email },
      select: { usuario_id: true },
    });
    if (existing && existing.usuario_id !== account.id) {
      throw new Error('Un correo de demostración ya pertenece a otra cuenta');
    }
    if (existing) {
      continue;
    }

    const hash = await passwords.hash(account.password);
    await prisma.usuario.create({
      data: {
        ...profileFor(account),
        usuario_id: account.id,
        correo: account.email,
        nombre: account.name,
        rol: account.role,
        estado: 'ACTIVO',
        cuenta_acceso: { create: { password_hash: hash } },
      },
    });
  }
}
