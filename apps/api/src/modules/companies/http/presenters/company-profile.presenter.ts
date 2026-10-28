import type { Company } from '../../domain/entities/company.entity';

export function presentCompanyProfile(company: Company) {
  return {
    id: company.id,
    razon_social: company.legalName,
    nit: company.taxId,
    eslogan: company.slogan,
    logo_url: company.logoUrl,
    banner_url: company.bannerUrl,
    descripcion_larga: company.description,
    tamano_empresa: company.companySize,
    sitio_web: company.website,
    correo: company.email,
  };
}
