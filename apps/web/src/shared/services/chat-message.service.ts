import { chatRequest, type ChatMessage } from "./chat-conversation.service";
export function sendChatMessage(input: {
  conversationId: string;
  content: string;
  clientId: string;
}): Promise<ChatMessage> {
  return chatRequest<ChatMessage>(
    `conversations/${input.conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        content: input.content,
        clientId: input.clientId,
      }),
    },
  );
}
