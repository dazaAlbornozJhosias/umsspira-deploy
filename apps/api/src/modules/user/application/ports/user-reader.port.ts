import type { ActorContext } from '../../../../shared/security/contexts/actor-context';

export const USER_READER = Symbol('USER_READER');
export interface UserReader {
  findActor(userId: string): Promise<ActorContext | null>;
}
