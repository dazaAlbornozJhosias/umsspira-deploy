import type {
  CompanyRegistryPage,
  RegisterCompanyPayload,
  RegisteredCompanyResponse,
  ResentCompanyInvitationResponse,
} from '@umsspira/shared-types';
import { apiClient } from '@/shared/services/api-client';

// apiClient agrega el token, el CSRF y lanza ApiClientError con el mensaje de la API.

export async function listCompanyRegistry(params: {
  search?: string;
  page: number;
  pageSize: number;
}): Promise<CompanyRegistryPage> {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  const response = await apiClient<{ data: CompanyRegistryPage }>(
    `/api/v1/companies/registry?${query.toString()}`,
    { authenticated: true },
  );
  return response.data;
}

export async function registerCompany(payload: RegisterCompanyPayload): Promise<RegisteredCompanyResponse> {
  const response = await apiClient<{ data: RegisteredCompanyResponse }>('/api/v1/companies/invitations', {
    method: 'POST',
    body: payload,
    authenticated: true,
  });
  return response.data;
}

export async function resendCompanyInvitation(invitationId: string): Promise<ResentCompanyInvitationResponse> {
  const response = await apiClient<{ data: ResentCompanyInvitationResponse }>(
    `/api/v1/companies/invitations/${encodeURIComponent(invitationId)}/resend`,
    { method: 'POST', authenticated: true },
  );
  return response.data;
}