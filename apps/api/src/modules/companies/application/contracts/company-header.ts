import type { Company } from '../../domain/entities/company.entity';

export type CompanyHeader = Pick<Company, 'legalName' | 'slogan' | 'logoUrl' | 'bannerUrl'>;
