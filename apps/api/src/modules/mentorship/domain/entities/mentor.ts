export interface Mentor {
  id: string;
  graduateId: string;
  graduateName: string;
  careerId: string | null;
  active: boolean;
  description: string | null;
  experience: string | null;
  relevantInformation: string | null;
  photoUrl: string | null;
  experienceYears: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type AvailabilityStatus = 'DISPONIBLE' | 'EN_PAUSA' | 'NO_DISPONIBLE';

export interface MentorAvailability {
  status: AvailabilityStatus | null;
  updatedAt: Date | null;
}

export interface AreaReference {
  id: string;
  name: string;
}

export interface MentorInterest extends AreaReference {
  area: AreaReference;
}

export interface MentorAreas {
  catalog: AreaReference[];
  selectedIds: string[];
  interests: MentorInterest[];
}

export interface InterestCatalogGroup {
  area: AreaReference;
  interests: (MentorInterest & { selected: boolean })[];
}

export interface DirectoryMentor {
  mentor: Mentor;
  areas: AreaReference[];
  interests: MentorInterest[];
  availability: AvailabilityStatus | null;
  cargo: string | null;
  empresa: string | null;
}

export interface DirectoryCatalogGroup {
  area: AreaReference;
  interests: AreaReference[];
}

export interface DirectoryPage {
  entries: DirectoryMentor[];
  total: number;
  catalog: DirectoryCatalogGroup[];
}

export interface MentorSchedule {
  weekday: number;
  start: string;
  end: string;
}

export interface MentorBooking {
  date: string;
  start: string;
  end: string;
}

export interface MentorDetail {
  mentor: Mentor;
  areas: AreaReference[];
  interests: MentorInterest[];
  availability: AvailabilityStatus | null;
  schedules: MentorSchedule[];
  bookings: MentorBooking[];
  position: string | null;
  company: string | null;
  canRequest: boolean;
}

export interface MentorSlotDay {
  date: string;
  weekday: number;
  times: string[];
}

export interface MentorProfile extends MentorDetail {
  week: { from: string; to: string; slots: MentorSlotDay[] };
}
