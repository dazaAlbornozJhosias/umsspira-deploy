import type { EventStatus } from './event';
import type { EventRegistrationStatus } from './event-registration';

export interface MyEventRegistration {
  id: string;
  status: EventRegistrationStatus;
  registeredAt: Date;
  hasPass: boolean;
  event: {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location: string | null;
    status: EventStatus;
  };
}