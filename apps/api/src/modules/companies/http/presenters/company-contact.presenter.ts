import type { CompanyContact } from '../../application/contracts/company-contact';

export function presentCompanyContact(company: CompanyContact) {
  return {
    description: company.description,
    taxId: company.taxId,
    companySize: company.companySize,
    address: company.address,
    email: company.email,
    phone: company.phone,
    website: company.website,
  };
}
