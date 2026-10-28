import type { UserRole } from '../../../../shared/security/contexts/actor-context';

export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  administrador: [
    'user:self:read',
    'auth:sessions:self',
    'solicitudes:read',
    'solicitudes:review',
    'eventos:manage',
    'reportes:read',
    'mentores:manage',
    'nlp:extract',
  ],
  titulado: [
    'user:self:read',
    'auth:sessions:self',
    'perfil:self:read',
    'perfil:self:write',
    'mentores:self:write',
    'eventos:read',
    'nlp:extract',
    'radar:self:read',
    'radar:self:write',
  ],
  empresa: [
    'user:self:read',
    'auth:sessions:self',
    'empresas:self:read',
    'empresas:self:write',
    'vacantes:create',
    'eventos:read',
  ],
};

export function canAccessCareer(careerIds: readonly string[], careerId: string): boolean {
  return careerIds.includes(careerId);
}

export function canAccessCompany(companyIds: readonly string[], companyId: string): boolean {
  return companyIds.includes(companyId);
}
