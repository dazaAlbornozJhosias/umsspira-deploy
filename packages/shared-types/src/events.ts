export const EVENT_STATUS = {
  BORRADOR: 'BORRADOR',
  PUBLICADO: 'PUBLICADO',
  CANCELADO: 'CANCELADO',
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  currentCapacity?: number;
  location: string | null;
  status: EventStatus;
  createdBy: string;
  createdAt: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  location?: string;
  status?: Extract<EventStatus, 'BORRADOR' | 'PUBLICADO'>;
}

export type UpdateDraftEventDto = Omit<CreateEventDto, 'status'>;

export interface EventFilters {
  status?: EventStatus;
  upcomingOnly?: boolean;
}
