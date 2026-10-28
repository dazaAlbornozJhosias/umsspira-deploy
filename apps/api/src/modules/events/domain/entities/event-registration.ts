export type EventRegistrationStatus = 'CONFIRMADA' | 'CANCELADA';

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: EventRegistrationStatus;
  registeredAt: Date;
  currentCapacity: number;
}
