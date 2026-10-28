import type {
  CompanyContactResponse,
  CompanyHeaderResponse,
  UpdateCompanyRequest,
} from '@umsspira/shared-types';
import { apiFetch, ApiError } from './api-client';
import { getCurrentUser } from '@/modules/auth/frontend/services/auth.service';

export async function getCurrentCompanyId(): Promise<string> {
  const companyId = (await getCurrentUser()).scopes.companyIds[0];
  if (!companyId) throw new ApiError(403, 'Tu cuenta no tiene una empresa asociada');
  return companyId;
}

export const getCompanyHeader = async () =>
  apiFetch<CompanyHeaderResponse>(`/api/v1/companies/${await getCurrentCompanyId()}/header`);

export const getCompanyContact = async () =>
  apiFetch<CompanyContactResponse>(`/api/v1/companies/${await getCurrentCompanyId()}/contact`);

export const updateCompanyProfile = async (data: UpdateCompanyRequest) =>
  apiFetch<unknown>(`/api/v1/companies/${await getCurrentCompanyId()}/profile`, { method: 'PUT', body: JSON.stringify(data) });
