import type { EventRegistrationStatus } from './event-registration';

export type ParticipantPassStatus = 'VIGENTE' | 'INVALIDADO' | 'SIN_PASE';

export interface EventParticipant {
  registrationId: string;
  name: string;
  status: EventRegistrationStatus;
  registeredAt: Date;
  passStatus: ParticipantPassStatus;
}

export interface EventOccupation {
  maxCapacity: number;
  confirmed: number;
  cancelled: number;
  available: number;
  occupancyPercent: number;
}

export interface EventParticipants {
  eventId: string;
  eventTitle: string;
  occupation: EventOccupation;
  participants: EventParticipant[];
}