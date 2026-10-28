// apps/api/src/modules/chat/chat-role-matrix.ts

const normalizeRole = (role: string | null | undefined): string =>
  (role ?? '').toString().trim().toLowerCase();

export const CHAT_ROLE_MATRIX: Record<string, string[]> = {
  titulado: ['titulado', 'egresado', 'empresa', 'administrador', 'admin'],
  egresado: ['titulado', 'egresado', 'empresa', 'administrador', 'admin'],
  empresa: ['empresa', 'titulado', 'egresado', 'administrador', 'admin'],
  administrador: ['administrador', 'admin', 'titulado', 'egresado', 'empresa'],
  admin: ['administrador', 'admin', 'titulado', 'egresado', 'empresa'],
};

export const canStartDirectChat = (
  actorRole: string | null | undefined,
  targetRole: string | null | undefined,
): boolean => {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);
  const allowed = CHAT_ROLE_MATRIX[actor] ?? [];
  return allowed.includes(target);
};