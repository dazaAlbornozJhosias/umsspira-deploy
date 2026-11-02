export const CHAT_EVENTS = Symbol('CHAT_EVENTS');
export interface ChatEvents {
  changed(conversationId: string, participantIds: string[]): void;
}
