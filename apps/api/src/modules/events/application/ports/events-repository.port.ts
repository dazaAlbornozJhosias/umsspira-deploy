import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { StoredFile } from '../../../../shared/files/contracts/uploaded-file';
import type { Event, InactiveEvent, RetiredEvent } from '../../domain/entities/event';
import type { EventRegistration } from '../../domain/entities/event-registration';
import type { CreateEventInput, EventInput } from '../contracts/event-inputs';
import type { EventParticipants } from '../../domain/entities/event-participants';
export const EVENTS_REPOSITORY = Symbol('EVENTS_REPOSITORY');

export interface EventsRepository {
  catalog(): Promise<Event[]>;
  published(id: string): Promise<Event>;
  owned(ownerId: string): Promise<Event[]>;
  findOwned(ownerId: string, id: string): Promise<Event>;
  create(ownerId: string, input: CreateEventInput): Promise<Event>;
  updateDraft(ownerId: string, id: string, input: EventInput): Promise<Event>;
  publishDraft(ownerId: string, id: string): Promise<Event>;
  register(userId: string, eventId: string): Promise<EventRegistration>;
  participants(ownerId: string, eventId: string): Promise<EventParticipants>;
  inactive(ownerId: string, now: Date): Promise<InactiveEvent[]>;
  retire(ownerId: string, id: string, now: Date): Promise<RetiredEvent>;
  cancelPublished(ownerId: string, id: string): Promise<Event>;
  saveCover(ownerId: string, file: StoredFile): Promise<void>;
  removeCover(ownerId: string, id: string): Promise<void>;
  readCover(id: string, actor?: ActorContext): Promise<StoredFile>;
}
