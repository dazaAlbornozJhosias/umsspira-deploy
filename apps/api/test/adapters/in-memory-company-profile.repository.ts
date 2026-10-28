import { DEMO_ACCOUNTS, DEMO_COMPANY_ID } from '../../scripts/seed/demo-accounts';
import type { Company } from '../../src/modules/companies/domain/entities/company.entity';
import type { CompanyProfileRepository } from '../../src/modules/companies/application/ports/company-profile-repository.port';
import type { UpdateCompanyProfileInput } from '../../src/modules/companies/application/contracts/update-company-profile.input';

interface StoredCompany extends Company {
  ownerId: string;
  phone: string | null;
  address: string | null;
}

export class InMemoryCompanyProfileRepository implements CompanyProfileRepository {
  readonly companies = new Map<string, StoredCompany>();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.companies.clear();
    this.companies.set(DEMO_COMPANY_ID, {
      id: DEMO_COMPANY_ID,
      ownerId: DEMO_ACCOUNTS[2].id,
      legalName: 'Empresa de demostración',
      taxId: '123456789',
      slogan: null,
      logoUrl: null,
      bannerUrl: null,
      description: null,
      companySize: null,
      website: null,
      email: 'empresa@umss.edu.bo',
      phone: null,
      address: null,
    });
  }

  private owned(companyId: string, ownerId: string): StoredCompany | null {
    const company = this.companies.get(companyId);
    return company?.ownerId === ownerId ? company : null;
  }

  async findHeader(companyId: string, ownerId: string) {
    const company = this.owned(companyId, ownerId);
    return company
      ? {
          legalName: company.legalName,
          slogan: company.slogan,
          logoUrl: company.logoUrl,
          bannerUrl: company.bannerUrl,
        }
      : null;
  }

  async findContact(companyId: string, ownerId: string) {
    const company = this.owned(companyId, ownerId);
    return company
      ? {
          description: company.description,
          taxId: company.taxId,
          companySize: company.companySize,
          website: company.website,
          email: company.email,
          phone: company.phone,
          address: company.address,
        }
      : null;
  }

  async updateProfile(
    companyId: string,
    ownerId: string,
    input: UpdateCompanyProfileInput,
    _now: Date,
  ) {
    const company = this.owned(companyId, ownerId);
    if (!company) {
      return null;
    }
    if (input.razonSocial !== undefined) {
      company.legalName = input.razonSocial;
    }
    if (input.eslogan !== undefined) {
      company.slogan = input.eslogan;
    }
    if (input.descripcionLarga !== undefined) {
      company.description = input.descripcionLarga;
    }
    if (input.tamanoEmpresa !== undefined) {
      company.companySize = input.tamanoEmpresa;
    }
    if (input.sitioWeb !== undefined) {
      company.website = input.sitioWeb;
    }
    if (input.correo !== undefined) {
      company.email = input.correo;
    }
    if (input.telefono !== undefined) {
      company.phone = input.telefono;
    }
    if (input.direccion !== undefined) {
      company.address = input.direccion;
    }
    return { ...company };
  }
}
