import { authenticatedFetch } from "./auth-session";
export interface ChatContact {
  id: string;
  name: string;
  role: string;
}
export interface ChatMessage {
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
export interface ConversationSummary {
  id: string;
  status: "PENDIENTE" | "ACEPTADO" | "RECHAZADO";
  requesterId: string;
  otherUser: ChatContact;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  lastActivityAt: string;
}
export class ChatApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}
export async function chatRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await authenticatedFetch(`/api/v1/chat/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok)
    throw new ChatApiError(
      result.error?.message ?? "No fue posible completar la operación",
      response.status,
      result.error?.code ?? "CHAT_ERROR",
    );
  return result.data as T;
}
export const searchChatContacts = (q: string, page = 1) =>
  chatRequest<{ items: ChatContact[]; hasMore: boolean }>(
    `contacts?q=${encodeURIComponent(q)}&page=${page}`,
  );
export const getConversationPage = (page = 1) =>
  chatRequest<{ items: ConversationSummary[]; hasMore: boolean }>(
    `conversations?page=${page}`,
  );
export const getMyConversations = async (): Promise<ConversationSummary[]> => {
  const items: ConversationSummary[] = [];
  let page = 1,
    more = true;
  while (more) {
    const result = await getConversationPage(page++);
    items.push(...result.items);
    more = result.hasMore;
  }
  return items;
};
export const getConversation = (id: string) =>
  chatRequest<ConversationSummary>(`conversations/${id}`);
export const getUnreadSummary = () =>
  chatRequest<{ total: number; conversations: ConversationSummary[] }>(
    "unread-summary",
  );
export const requestConversation = (
  recipientId: string,
  content: string,
  clientId: string,
) =>
  chatRequest<{ conversation: { id: string }; created: boolean }>(
    "conversations",
    {
      method: "POST",
      body: JSON.stringify({ recipientId, content, clientId }),
    },
  );
export const getConversationMessagesPage = (id: string, before?: string) =>
  chatRequest<{ items: ChatMessage[]; nextCursor: string | null }>(
    `conversations/${id}/messages${before ? `?before=${before}` : ""}`,
  );
export const respondToChatRequest = (
  id: string,
  decision: "accept" | "decline",
) =>
  chatRequest(`conversations/${id}/request`, {
    method: "PATCH",
    body: JSON.stringify({ decision }),
  });
export const markConversationAsRead = (id: string, messageId: string) =>
  chatRequest(`conversations/${id}/read-receipt`, {
    method: "PUT",
    body: JSON.stringify({ messageId }),
  });
export const editChatMessage = (
  id: string,
  messageId: string,
  content: string,
) =>
  chatRequest<ChatMessage>(`conversations/${id}/messages/${messageId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
export const deleteChatMessage = (id: string, messageId: string) =>
  chatRequest<ChatMessage>(`conversations/${id}/messages/${messageId}`, {
    method: "DELETE",
  });

// Los archivos viajan directamente a la API para no depender del límite del proxy de Vercel.
const fileUrl = (path: string) =>
  `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/v1/chat/${path}`;
export async function sendChatAttachment(
  id: string,
  file: File,
  input: { content: string; clientId: string },
): Promise<ChatMessage> {
  const form = new FormData();
  form.append("file", file);
  form.append("clientId", input.clientId);
  form.append("content", input.content);
  const response = await authenticatedFetch(
    fileUrl(`conversations/${id}/attachments`),
    { method: "POST", body: form },
  );
  const result = await response.json();
  if (!response.ok)
    throw new ChatApiError(
      result.error?.message ?? "No fue posible enviar el archivo",
      response.status,
      result.error?.code ?? "CHAT_UPLOAD_FAILED",
    );
  return result.data as ChatMessage;
}
export async function downloadChatAttachment(
  id: string,
  messageId: string,
  name: string,
): Promise<void> {
  const response = await authenticatedFetch(
    fileUrl(`conversations/${id}/messages/${messageId}/attachment`),
  );
  if (!response.ok)
    throw new Error("El archivo ya no está disponible o no tienes acceso");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
