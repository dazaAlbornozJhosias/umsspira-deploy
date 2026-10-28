import type { Company } from '../../domain/entities/company.entity';
import type { CompanyHeader } from '../contracts/company-header';
import type { CompanyContact } from '../contracts/company-contact';
import type { UpdateCompanyProfileInput } from '../contracts/update-company-profile.input';

export const COMPANY_PROFILE_REPOSITORY = Symbol('COMPANY_PROFILE_REPOSITORY');

export interface CompanyProfileRepository {
  findHeader(companyId: string, ownerId: string): Promise<CompanyHeader | null>;
  findContact(companyId: string, ownerId: string): Promise<CompanyContact | null>;
  updateProfile(
    companyId: string,
    ownerId: string,
    input: UpdateCompanyProfileInput,
    now: Date,
  ): Promise<Company | null>;
}
