import type {
  InterestCatalogGroup,
  MentorAreas,
  MentorInterest,
} from '../../domain/entities/mentor';

export const MENTOR_CATALOG_REPOSITORY = Symbol('MENTOR_CATALOG_REPOSITORY');

export interface MentorCatalogRepository {
  areas(userId: string): Promise<MentorAreas>;
  setAreas(userId: string, ids: string[]): Promise<MentorAreas>;
  interestCatalog(userId: string): Promise<InterestCatalogGroup[]>;
  interests(userId: string): Promise<MentorInterest[]>;
  addInterests(userId: string, ids: string[]): Promise<MentorInterest[]>;
  removeInterest(userId: string, id: string): Promise<void>;
}
