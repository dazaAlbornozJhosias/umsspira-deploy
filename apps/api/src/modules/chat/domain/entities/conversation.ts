export type ConversationStatus = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';

export interface Conversation {
  id: string;
  status: ConversationStatus;
  requesterId: string;
  participantIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  clientId: string | null;
  content: string;
  sentAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  attachment?: { name: string; mime: string; size: number } | null;
}

export interface ConversationSummary extends Conversation {
  otherUser: { id: string; name: string; role: string };
  lastMessage: Message | null;
  unreadCount: number;
  lastActivityAt: string;
}
