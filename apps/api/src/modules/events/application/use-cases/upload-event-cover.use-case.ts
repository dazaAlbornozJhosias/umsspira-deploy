import { randomUUID } from 'node:crypto';
import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import type { UploadedFileData } from '../../../../shared/files/contracts/uploaded-file';
import { safeFileName, validateImage } from '../../../../shared/files/policies/image-file.policy';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { EventsRepository } from '../ports/events-repository.port';

export class UploadEventCoverUseCase {
  constructor(private readonly repository: EventsRepository) {}

  async execute(actor: ActorContext, file?: UploadedFileData) {
    if (!file) {
      throw new BusinessRuleError(
        'invalid',
        'COVER_REQUIRED',
        'Adjunta una portada JPG, PNG o WebP',
      );
    }
    const mime = validateImage(file.originalname, file.buffer);
    const id = randomUUID();
    await this.repository.saveCover(actor.id, {
      id,
      name: safeFileName(file.originalname),
      mime,
      bytes: file.buffer,
      size: file.buffer.length,
    });
    return id;
  }
}
