import type { DirectoryMentor, DirectoryPage, Mentor, MentorDetail } from '../../domain/entities/mentor';
import type { MentorInformationInput, ParticipationInput } from '../contracts/mentor-inputs';
import type {
  MentorDirectoryFilters,
  MentorFilterOptions,
} from '../contracts/mentor-directory-filters';

export interface MentorDirectoryQuery {
  offset: number;
  limit?: number;
}

export const MENTOR_REPOSITORY = Symbol('MENTOR_REPOSITORY');

export interface MentorRepository {
  directory(query?: MentorDirectoryQuery): Promise<DirectoryPage>;
  filteredDirectory(filters: MentorDirectoryFilters): Promise<DirectoryMentor[]>;
  filterOptions(areaIds: string[]): Promise<MentorFilterOptions>;
  /** `from` y `to` (YYYY-MM-DD, inclusive) acotan las reservas que ocupan horarios. */
  detail(mentorId: string, from: string, to: string): Promise<MentorDetail | null>;
  eligible(userId: string): Promise<boolean>;
  own(userId: string): Promise<Mentor | null>;
  participate(userId: string, input: ParticipationInput): Promise<Mentor>;
  updateInformation(userId: string, input: MentorInformationInput): Promise<Mentor>;
  clearInformation(userId: string): Promise<void>;
  deactivate(mentorId: string, careerIds: readonly string[]): Promise<Mentor>;
}
