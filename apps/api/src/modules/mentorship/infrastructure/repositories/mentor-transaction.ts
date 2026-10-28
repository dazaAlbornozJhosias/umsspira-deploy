import type { Prisma } from '../../../../generated/prisma/client';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';

export async function lockGraduate(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM titulado WHERE id_usuario = ${userId}::uuid FOR UPDATE`;
  const graduate = await tx.titulado.findFirst({
    where: { id_usuario: userId, usuario: { estado: 'ACTIVO', rol: 'titulado' } },
    select: { id: true },
  });
  if (!graduate) {
    throw new BusinessRuleError(
      'forbidden',
      'MENTOR_NOT_ELIGIBLE',
      'Solo un titulado aprobado puede gestionar su participación',
    );
  }
  return graduate;
}

export async function lockOwnMentor(tx: Prisma.TransactionClient, userId: string, active = false) {
  const graduate = await lockGraduate(tx, userId);
  const mentor = await tx.mentor.findUnique({ where: { id_titulado: graduate.id } });
  if (!mentor) {
    return mentorMissing();
  }
  if (active && mentor.esta_activo !== true) {
    throw new BusinessRuleError(
      'forbidden',
      'MENTOR_INACTIVE',
      'Se requiere un perfil de mentor activo',
    );
  }
  return mentor;
}

export function mentorMissing(): never {
  throw new BusinessRuleError(
    'missing',
    'MENTOR_NOT_FOUND',
    'El usuario no tiene perfil de mentor',
  );
}

export const availabilityOrder = [
  { fecha_actualizacion: { sort: 'desc' as const, nulls: 'last' as const } },
  { fecha_creacion: { sort: 'desc' as const, nulls: 'last' as const } },
  { id: 'desc' as const },
];
