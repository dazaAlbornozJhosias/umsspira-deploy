export const USER_ROLES = ['administrador', 'titulado', 'empresa'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface ActorContext {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  permissions: readonly string[];
  scopes: { companyIds: string[]; graduateId: string | null; careerIds: string[] };
  credentialVersion: number;
}

export interface AuthenticatedContext {
  actor: ActorContext;
  sessionId: string;
}
