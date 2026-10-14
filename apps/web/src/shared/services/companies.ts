import type {
  CompanyContactResponse,
  CompanyHeaderResponse,
  UpdateCompanyRequest,
} from '@umsspira/shared-types';
import { apiFetch } from './api-client';

export const getCompanyHeader = () =>
  apiFetch<CompanyHeaderResponse>('/api/empresa/perfil/header');

export const getCompanyContact = () =>
  apiFetch<CompanyContactResponse>('/api/empresa/perfil/contacto');

export const updateCompanyProfile = (data: UpdateCompanyRequest) =>
  apiFetch<unknown>('/api/empresa/perfil', { method: 'PUT', body: JSON.stringify(data) });