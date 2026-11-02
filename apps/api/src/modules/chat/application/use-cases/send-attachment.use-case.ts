import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import { attachmentMetadata } from '../../domain/policies/attachment.policy';
import type { SendMessageUseCase } from './send-message.use-case';

export class SendAttachmentUseCase {
  constructor(private readonly send: SendMessageUseCase) {}
  execute(
    actorId: string,
    id: string,
    input: { clientId: string; content: string },
    file?: { name: string; bytes: Uint8Array },
  ) {
    if (!file) {
      throw new BusinessRuleError('invalid', 'CHAT_ATTACHMENT_REQUIRED', 'Selecciona un archivo');
    }
    const attachment = { ...attachmentMetadata(file.name, file.bytes), bytes: file.bytes };
    return this.send.execute(actorId, id, { ...input, attachment });
  }
}
