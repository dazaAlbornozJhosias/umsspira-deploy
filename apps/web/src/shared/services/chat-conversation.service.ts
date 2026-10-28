// apps/web/src/shared/services/chat-conversation.service.ts
import { authenticatedFetch } from './auth-session';

export const startDirectChat = async (targetUserId: string) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const response = await authenticatedFetch(
    `${baseUrl}/api/v1/chat/conversations/direct`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ targetUserId }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ??
        `Error ${response.status}: No se pudo iniciar el chat`,
    );
  }

  return response.json() as Promise<{ conversationId: string }>;
};

export interface ConversationSummary {
  id: string;
  otherUser: { id: string; name: string; role: string };
  lastMessage: {
    content: string;
    sentAt: string | null;
    senderId: string | null;
  } | null;
  lastActivityAt: string | null;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  emisor_id: string | null;
  contenido: string | null;
  fecha_mensaje: string | null;
}

export interface ChatMessagesPage {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ChatMessagesPageOptions {
  limit?: number;
  beforeId?: string;
}

const readApiError = async (
  response: Response,
  fallback: string,
) => {
  const data = await response.json().catch(() => ({}));
  return data?.error?.message ?? data?.message ?? fallback;
};

export const getMyConversations = async (): Promise<
  ConversationSummary[]
> => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const response = await authenticatedFetch(
    `${baseUrl}/api/v1/chat/conversations`,
    { credentials: 'include' },
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        'No se pudieron cargar tus conversaciones',
      ),
    );
  }

  return response.json();
};

export const getConversationMessagesPage = async (
  conversationId: string,
  options: ChatMessagesPageOptions = {},
): Promise<ChatMessagesPage> => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const params = new URLSearchParams();
  params.set('limit', String(options.limit ?? 30));

  if (options.beforeId) {
    params.set('beforeId', options.beforeId);
  }

  const response = await authenticatedFetch(
    `${baseUrl}/api/v1/chat/conversations/${conversationId}/messages?${params.toString()}`,
    { credentials: 'include' },
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        'No se pudieron cargar los mensajes',
      ),
    );
  }

  return response.json() as Promise<ChatMessagesPage>;
};

/**
 * Mantiene la compatibilidad con los componentes existentes
 * que esperan recibir únicamente un arreglo de mensajes.
 */
export const getConversationMessages = async (
  conversationId: string,
): Promise<ChatMessage[]> => {
  const page = await getConversationMessagesPage(conversationId);
  return page.messages;
};

/** HU-07 CA-02: marca como leídos los mensajes de la conversación abierta. */
export const markConversationAsRead = async (
  conversationId: string,
): Promise<void> => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const response = await authenticatedFetch(
    `${baseUrl}/api/v1/chat/conversations/${conversationId}/read`,
    { method: 'PATCH', credentials: 'include' },
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        'No se pudo marcar la conversación como leída',
      ),
    );
  }
};