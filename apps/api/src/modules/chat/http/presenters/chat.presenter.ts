import type {
  Conversation,
  ConversationSummary,
  Message,
} from '../../domain/entities/conversation';

export function presentConversation(value: Conversation) {
  return { id: value.id, status: value.status, requesterId: value.requesterId };
}
export function presentMessage(value: Message) {
  return {
    id: value.id,
    conversationId: value.conversationId,
    senderId: value.senderId,
    clientId: value.clientId,
    content: value.content,
    sentAt: value.sentAt,
    editedAt: value.editedAt,
    deletedAt: value.deletedAt,
    attachment: value.attachment
      ? { name: value.attachment.name, mime: value.attachment.mime, size: value.attachment.size }
      : null,
  };
}
export function presentSummary(value: ConversationSummary) {
  return {
    ...presentConversation(value),
    otherUser: { id: value.otherUser.id, name: value.otherUser.name, role: value.otherUser.role },
    lastMessage: value.lastMessage ? presentMessage(value.lastMessage) : null,
    unreadCount: value.unreadCount,
    lastActivityAt: value.lastActivityAt,
  };
}
