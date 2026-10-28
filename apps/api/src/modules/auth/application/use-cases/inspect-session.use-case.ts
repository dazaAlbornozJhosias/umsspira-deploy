import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { SessionReader } from '../services/session-reader.service';

export class InspectSessionUseCase {
  constructor(private readonly reader: SessionReader) {}

  async execute(refreshToken: string): Promise<ActorContext> {
    return this.reader.actorFor((await this.reader.proof(refreshToken, true)).session);
  }
}
