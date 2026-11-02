import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export const MAIL_EVENTS_REPOSITORY = Symbol('MAIL_EVENTS_REPOSITORY');

export interface MailRetryResult {
  requeued: number;
  expired: number;
}

export interface MailEventsRepository {
  // Sin id reprocesa por lote los correos fallidos del alcance del actor.
  requeueFailed(actor: ActorContext, id?: string): Promise<MailRetryResult>;
}