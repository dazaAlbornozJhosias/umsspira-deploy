import type { SesionAcceso } from '../../../../generated/prisma/client';
import type { AuthSession } from '../../domain/entities/auth-session.entity';

export function toSession(row: SesionAcceso): AuthSession {
  return {
    id: row.id,
    userId: row.id_usuario,
    credentialVersion: row.version_credenciales,
    csrfHash: row.csrf_hash,
    createdAt: row.creada_en,
    renewedAt: row.renovada_en,
    expiresAt: row.expira_en,
    revokedAt: row.revocada_en,
    remember: row.recordar,
    agent: row.agente,
  };
}
