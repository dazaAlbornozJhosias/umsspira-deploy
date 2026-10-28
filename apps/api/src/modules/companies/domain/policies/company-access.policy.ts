import { AccessError } from '../../../../shared/security/errors/access-error';

export function assertCompanyAccess(companyIds: readonly string[], companyId: string): void {
  if (!companyIds.includes(companyId)) {
    throw new AccessError('FORBIDDEN');
  }
}
