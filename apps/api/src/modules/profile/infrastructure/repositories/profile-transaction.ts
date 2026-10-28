import type { Prisma } from '../../../../generated/prisma/client';
import type { ProfileScope } from '../../application/contracts/profile-inputs';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';

export async function lockGraduate(
  tx: Prisma.TransactionClient,
  scope: ProfileScope,
): Promise<void> {
  const rows = await tx.$queryRaw<
    { id: string }[]
  >`SELECT id FROM titulado WHERE id = ${scope.graduateId}::uuid AND id_usuario = ${scope.userId}::uuid FOR UPDATE`;
  if (!rows.length) {
    throw new BusinessRuleError(
      'missing',
      'PROFILE_NOT_FOUND',
      'No se encontró tu perfil de titulado',
    );
  }
}

export function profileRecordMissing(): never {
  throw new BusinessRuleError(
    'missing',
    'PROFILE_RECORD_NOT_FOUND',
    'El registro no existe o no pertenece a tu perfil',
  );
}

export function profileRecordForbidden(): never {
  throw new BusinessRuleError(
    'forbidden',
    'PROFILE_RECORD_FORBIDDEN',
    'No tienes permiso para modificar este registro',
  );
}

export async function rejectProfileRecord(lookup: Promise<unknown>): Promise<never> {
  if (await lookup) {
    profileRecordForbidden();
  }
  return profileRecordMissing();
}
