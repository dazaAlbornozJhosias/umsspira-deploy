import type { CompanyHeader } from '../../application/contracts/company-header';

export function presentCompanyHeader(company: CompanyHeader) {
  return {
    nombre: company.legalName,
    eslogan: company.slogan,
    logoUrl: company.logoUrl,
    bannerUrl: company.bannerUrl,
  };
}
