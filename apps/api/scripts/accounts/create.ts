import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { USER_ROLES } from '../../src/shared/security/contexts/actor-context';
import { Argon2PasswordHasher } from '../../src/modules/auth/infrastructure/security/argon2-password.hasher';
import { createDatabaseClient } from '../database-client';

const accountSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
    password: z.string().min(15).max(128),
    role: z.enum(USER_ROLES),
    name: z.string().trim().min(1).max(100),
  })
  .strict();

async function createAccount(): Promise<void> {
  // La entrada estándar evita colocar contraseñas en argumentos y mensajes de consola.
  const input = accountSchema.parse(JSON.parse(readFileSync(0, 'utf8')));
  const prisma = createDatabaseClient();
  try {
    const role = await prisma.rolAcceso.findUnique({ where: { codigo: input.role } });
    if (!role?.habilitado) {
      throw new Error('Rol no disponible');
    }
    const passwordHash = await new Argon2PasswordHasher().hash(input.password);
    const user = await prisma.usuario.create({
      data: {
        usuario_id: randomUUID(),
        correo: input.email,
        nombre: input.name,
        rol: input.role,
        estado: 'ACTIVO',
        cuenta_acceso: { create: { password_hash: passwordHash } },
      },
      select: { usuario_id: true, rol: true },
    });
    console.info(JSON.stringify({ id: user.usuario_id, role: user.rol }));
  } finally {
    await prisma.$disconnect();
  }
}

void createAccount().catch(() => {
  console.error(
    'No se pudo crear la cuenta. Revisa la entrada, el catálogo y la unicidad del correo.',
  );
  process.exitCode = 1;
});
