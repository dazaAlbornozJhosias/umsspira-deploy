export const EVENT_STATUS = {
  BORRADOR: 'BORRADOR',
  PUBLICADO: 'PUBLICADO',
  CANCELADO: 'CANCELADO',
} as const;

export const EVENT_MAX_CAPACITY = 10_000 as const;
export const EVENT_TITLE_MAX_LENGTH = 45 as const;
export const EVENT_LOCATION_MAX_LENGTH = 100 as const;
export const EVENT_DATE_MIN_YEAR = 1900 as const;
export const EVENT_DATE_MAX_YEAR = 2100 as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const EVENT_REGISTRATION_STATUS = {
  CONFIRMADA: 'CONFIRMADA',
  CANCELADA: 'CANCELADA',
} as const;

export type EventRegistrationStatus =
  (typeof EVENT_REGISTRATION_STATUS)[keyof typeof EVENT_REGISTRATION_STATUS];

export interface EventRegistrationItem {
  id: string;
  eventId: string;
  status: Extract<EventRegistrationStatus, 'CONFIRMADA'>;
  registeredAt: string;
  currentCapacity: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  currentCapacity?: number;
  location: string | null;
  imageUrl?: string | null;
  status: EventStatus;
  createdBy: string;
  creatorName?: string;
  createdAt: string;
}

export type InactiveEventStatus = Extract<
  EventStatus,
  'CANCELADO' | 'FINALIZADO'
>;

export interface InactiveEventItem extends EventItem {
  inactiveStatus: InactiveEventStatus;
  registrationsCount: number;
  passesCount: number;
}

export interface RetiredEventItem {
  id: string;
  registrationsCount: number;
  passesCount: number;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  location?: string;
  imageUrl?: string;
  status?: Extract<EventStatus, 'BORRADOR' | 'PUBLICADO'>;
}

export type UpdateDraftEventDto = Omit<CreateEventDto, 'status'>;

export interface EventFilters {
  status?: EventStatus;
  upcomingOnly?: boolean;
}

export type EventParticipantPassStatus = 'VIGENTE' | 'INVALIDADO' | 'SIN_PASE';

export interface EventParticipantItem {
  registrationId: string;
  name: string;
  status: EventRegistrationStatus;
  registeredAt: string;
  passStatus: EventParticipantPassStatus;
}

export interface EventOccupationSummary {
  maxCapacity: number;
  confirmed: number;
  cancelled: number;
  available: number;
  occupancyPercent: number;
}

export interface EventParticipantsDto {
  eventId: string;
  eventTitle: string;
  occupation: EventOccupationSummary;
  participants: EventParticipantItem[];
}
