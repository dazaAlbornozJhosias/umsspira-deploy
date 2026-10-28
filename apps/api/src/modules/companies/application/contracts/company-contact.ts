import type { Company } from '../../domain/entities/company.entity';

export type CompanyContact = Pick<
  Company,
  'description' | 'taxId' | 'companySize' | 'email' | 'website'
> & {
  phone: string | null;
  address: string | null;
};
