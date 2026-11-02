import type {
  Conversation,
  ConversationStatus,
  ConversationSummary,
  Message,
} from '../../domain/entities/conversation';

export interface MessageInput {
  clientId: string;
  content: string;
  attachment?: { name: string; mime: string; size: number; bytes: Uint8Array };
}

export interface ChatTransaction {
  conversation: Conversation;
  findMessage(id: string): Promise<Message | null>;
  findDelivery(clientId: string): Promise<Message | null>;
  append(input: MessageInput): Promise<Message>;
  edit(id: string, content: string): Promise<Message>;
  remove(id: string): Promise<Message>;
  respond(status: ConversationStatus): Promise<Conversation>;
  markRead(message: Message): Promise<void>;
}

export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');
export interface ChatRepository {
  attachment(
    id: string,
    actorId: string,
    messageId: string,
  ): Promise<{ name: string; mime: string; bytes: Uint8Array }>;
  unread(actorId: string): Promise<{ total: number; conversations: ConversationSummary[] }>;
  start(
    actorId: string,
    recipientId: string,
    input: MessageInput,
  ): Promise<{ conversation: Conversation; created: boolean }>;
  get(id: string, actorId: string): Promise<ConversationSummary>;
  list(actorId: string, page: number): Promise<{ items: ConversationSummary[]; hasMore: boolean }>;
  messages(
    id: string,
    actorId: string,
    before?: string,
  ): Promise<{ items: Message[]; nextCursor: string | null }>;
  transaction<T>(
    id: string,
    actorId: string,
    work: (tx: ChatTransaction) => Promise<T>,
  ): Promise<T>;
}
