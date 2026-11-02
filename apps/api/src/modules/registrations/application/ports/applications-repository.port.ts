import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { ApplicationQuery, ReviewInput } from '../contracts/registration-inputs';
import type {
  ApplicationDetail,
  ApplicationMetrics,
  ApplicationPage,
  ReviewResult,
} from '../../domain/entities/application';
import type { RegistrationFile } from '../../domain/entities/registration';

export const APPLICATIONS_REPOSITORY = Symbol('APPLICATIONS_REPOSITORY');

export type ActivationCheck =
  | { result: 'invalid' | 'expired' | 'locked' }
  | { result: 'verified'; binding: string };

export type ActivationResult =
  | 'activated'
  | 'invalid'
  | 'expired'
  | 'locked'
  | 'already'
  | 'account-exists';
  
export interface ResolutionMailRecord {
  type: 'aprobacion' | 'observacion' | 'rechazo';
  to: string;
  subject: string;
}

export interface ApplicationsRepository {
  countRejections(id: string): Promise<number>;
  renewActivation(
    actor: ActorContext,
    id: string,
    hash: string,
    encryptedMail: string,
  ): Promise<void>;
  list(actor: ActorContext, query: ApplicationQuery): Promise<ApplicationPage>;
    metrics(actor: ActorContext, now: Date): Promise<ApplicationMetrics>;
  find(actor: ActorContext, id: string): Promise<ApplicationDetail>;
  document(actor: ActorContext, id: string): Promise<RegistrationFile>;
  review(
    actor: ActorContext,
    id: string,
    input: ReviewInput,
    activationHash: string | null,
    encryptedMail: string,
    mail: ResolutionMailRecord,
  ): Promise<ReviewResult>;
  verifyActivation(id: string, codeHash: string): Promise<ActivationCheck>;
    activate(
      id: string,
      passwordHash: string,
      matchesBinding: (binding: string) => boolean,
    ): Promise<ActivationResult>;
}
