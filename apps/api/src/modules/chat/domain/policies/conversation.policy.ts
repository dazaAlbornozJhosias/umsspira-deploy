import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { Conversation, ConversationStatus, Message } from '../entities/conversation';

export function assertParticipant(conversation: Conversation, actorId: string): void {
  if (!conversation.participantIds.includes(actorId)) {
    throw new BusinessRuleError('missing', 'CHAT_NOT_FOUND', 'No se encontró la conversación');
  }
}

export function messageContent(value: string): string {
  const content = value.trim();
  if (!content || content.length > 500) {
    throw new BusinessRuleError(
      'invalid',
      'CHAT_INVALID_MESSAGE',
      'Escribe un mensaje de 1 a 500 caracteres',
    );
  }
  return content;
}

export function assertCanSend(conversation: Conversation, actorId: string): void {
  assertParticipant(conversation, actorId);
  if (conversation.status !== 'ACEPTADO') {
    throw new BusinessRuleError(
      'conflict',
      'CHAT_REQUEST_REQUIRED',
      'La solicitud debe ser aceptada para continuar',
    );
  }
}

export function assertCanRespond(
  conversation: Conversation,
  actorId: string,
  status: ConversationStatus,
): void {
  assertParticipant(conversation, actorId);
  if (conversation.requesterId === actorId) {
    throw new BusinessRuleError(
      'forbidden',
      'CHAT_RECIPIENT_ONLY',
      'Solo el destinatario puede responder a la solicitud',
    );
  }
  if (
    status === 'PENDIENTE' ||
    conversation.status === 'ACEPTADO' ||
    (conversation.status === 'RECHAZADO' && status !== 'ACEPTADO')
  ) {
    throw new BusinessRuleError(
      'conflict',
      'CHAT_REQUEST_PROCESSED',
      'Esta solicitud ya fue procesada',
    );
  }
}

export function assertOwnMessage(
  message: Message | null,
  actorId: string,
): asserts message is Message {
  if (!message) {
    throw new BusinessRuleError('missing', 'CHAT_MESSAGE_NOT_FOUND', 'No se encontró el mensaje');
  }
  if (message.senderId !== actorId) {
    throw new BusinessRuleError(
      'forbidden',
      'CHAT_OWN_MESSAGE_ONLY',
      'Solo puedes modificar tus propios mensajes',
    );
  }
}

export function assertSameDelivery(
  message: Message,
  conversationId: string,
  content: string,
): void {
  if (
    message.conversationId !== conversationId ||
    (!message.deletedAt && message.content !== content && !message.editedAt)
  ) {
    throw new BusinessRuleError(
      'conflict',
      'CHAT_CLIENT_ID_REUSED',
      'El identificador de envío ya fue utilizado',
    );
  }
}
