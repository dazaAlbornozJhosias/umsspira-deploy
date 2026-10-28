import type { AreaReference, MentorInterest } from '../../domain/entities/mentor';

export interface MentorDirectoryFilters {
  areaIds: string[];
  interestIds: string[];
}

export interface MentorFilterOptions {
  areas: AreaReference[];
  interests: MentorInterest[];
}
