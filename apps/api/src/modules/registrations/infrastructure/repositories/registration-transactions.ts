import type { Prisma } from '../../../../generated/prisma/client';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { RegistrationData } from '../../domain/entities/registration';
import { assertOpenDraft, assertVerifiedDraft } from '../../domain/policies/registration.policy';
import { toRegistrationDraft } from '../translators/registration.translator';

export async function lockDraft(tx: Prisma.TransactionClient, hash: string, verified = false) {
  await tx.$queryRaw`SELECT id FROM borrador_registro WHERE token_hash = ${hash} FOR UPDATE`;
  const row = await tx.borradorRegistro.findUnique({ where: { token_hash: hash } });
  const draft = row ? toRegistrationDraft(row) : null;
  if (verified) {
    assertVerifiedDraft(draft);
  } else {
    assertOpenDraft(draft);
  }
  return { row: row!, draft };
}

export const MAX_REJECTIONS = 5;

export async function assertRejectionLimit(
  tx: Prisma.TransactionClient,
  data: RegistrationData,
) {
  const ci = data.ci.replace(/\D/g, '');
  const extension = data.complementoCi.trim().toUpperCase();
  const issuedIn =
    data.expedidoEn === 'EX' ? 'Extranjero' : data.expedidoEn;

  const rows = await tx.$queryRaw<{ total: number }[]>`
    SELECT COUNT(*)::integer AS total
    FROM solicitud s
    JOIN detalle_solicitud d
      ON d.id = s.id_detalle_solicitud
    WHERE UPPER(TRIM(s.estado))
      IN ('REJECTED', 'RECHAZADO', 'RECHAZADA')
      AND REGEXP_REPLACE(
        COALESCE(d.ci, ''),
        '[^0-9]', '', 'g'
      ) = ${ci}
      AND UPPER(TRIM(COALESCE(d.extension_ci, '')))
        = ${extension}
      AND d.expedido_en::text = ${issuedIn}
  `;

  if ((rows[0]?.total ?? 0) >= MAX_REJECTIONS) {
    throw new BusinessRuleError(
      'conflict',
      'REJECTION_LIMIT_REACHED',
      'Alcanzaste el límite de cinco solicitudes rechazadas',
    );
  }
}

export async function assertNoDuplicate(tx: Prisma.TransactionClient, data: RegistrationData) {
  // Las mismas identidades toman los mismos bloqueos, incluso desde borradores distintos.
  const keys = [
    'email:' + data.correo,
    'sis:' + Number(data.codigoSis),
    'ci:' + data.ci.replace(/\D/g, '') + ':' + data.complementoCi.trim().toUpperCase() + ':' + data.expedidoEn,
  ].sort();
  for (const key of keys) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  }

  await assertRejectionLimit(tx, data);

  const identity = {
    OR: [
      { email: { equals: data.correo, mode: 'insensitive' as const } },
      { cod_sis: data.codigoSis },
      { ci: data.ci, extension_ci: data.complementoCi },
    ],
  };
  const [application, user, graduate] = await Promise.all([
    tx.solicitud.findFirst({
      where: {
        estado: { not: 'RECHAZADA' },
        detalle_solicitud: { is: identity },
      },
      select: { id: true },
    }),
    tx.usuario.findFirst({
      where: { correo: { equals: data.correo, mode: 'insensitive' } },
      select: { usuario_id: true },
    }),
    tx.titulado.findFirst({
      where: {
        OR: [{ cod_sis: data.codigoSis }, { ci: data.ci, extension_ci: data.complementoCi }],
      },
      select: { id: true },
    }),
  ]);
  if (application || user || graduate) {
    throw new BusinessRuleError(
      'conflict',
      'REGISTRATION_EXISTS',
      'Ya existe una cuenta o solicitud con estos datos',
    );
  }
}

export async function lockDraftForSubmission(
  tx: Prisma.TransactionClient,
  tokenHash: string,
) {
  await tx.$queryRaw`
    SELECT id
    FROM borrador_registro
    WHERE token_hash = ${tokenHash}
    FOR UPDATE
  `;

  const row = await tx.borradorRegistro.findUnique({
    where: { token_hash: tokenHash },
  });

  if (!row) {
    throw new BusinessRuleError(
      'expired',
      'REGISTRATION_EXPIRED',
      'El registro no existe o ya no está disponible',
    );
  }

  return {
    row,
    draft: toRegistrationDraft(row),
  };
}