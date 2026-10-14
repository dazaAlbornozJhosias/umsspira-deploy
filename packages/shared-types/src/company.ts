// packages/shared-types/src/company.ts

// ============================================================
// Tipos NUEVOS (alineados con el backend real - HUs 02, 03, 04)
// ============================================================

/**
 * HU-02: Respuesta de GET /api/empresa/perfil/header
 */
export interface CompanyHeaderResponse {
  nombre: string;
  eslogan: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
}

/**
 * HU-03: Respuesta de GET /api/empresa/perfil/contacto
 */
export interface CompanyContactResponse {
  description: string | null;
  taxId: string | null;
  companySize: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  phone: string | null;
}

/**
 * HU-04: Body de PUT /api/empresa/perfil
 * El NIT/RUC NO esta incluido (es inmutable)
 */
export interface UpdateCompanyRequest {
  razonSocial?: string;
  eslogan?: string;
  descripcionLarga?: string;
  tamanoEmpresa?: string;
  sitioWeb?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
}

/**
 * HU-04: Respuesta de PUT /api/empresa/perfil
 */
export interface CompanyProfileResponse {
  id: string;
  razon_social: string | null;
  nit: string | null;
  eslogan: string | null;
  logo_url: string | null;
  banner_url: string | null;
  descripcion_larga: string | null;
  tamano_empresa: string | null;
  sitio_web: string | null;
  correo: string | null;
}

// ============================================================
// Tipos ANTIGUOS (mantener por compatibilidad con frontend actual)
// @deprecated Usar los tipos especificos de cada endpoint
// ============================================================

/** @deprecated Usar CompanyHeaderResponse, CompanyContactResponse o CompanyProfileResponse */
export interface Company {
  id: string;
  nombre: string;
  nit: string;
  descripcion: string;
  telefono: string;
  correo: string;
  sitioWeb: string;
  direccion: string;
  tamano: string;
  eslogan?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export type UpdateCompanyPayload = Omit<Company, 'id' | 'nit'>;