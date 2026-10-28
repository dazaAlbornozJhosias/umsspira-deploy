// apps/web/src/shared/services/chat-message.service.ts
import { getChatSocket } from './chat-socket';

export interface SendChatMessageInput {
  conversationId: string;
  content: string;
}

export interface SendChatMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const SEND_TIMEOUT_MS = 10_000;

/**
 * Envía un mensaje por el socket del chat. Nunca lanza: siempre devuelve
 * { success }. El emisor lo determina el servidor desde la sesión,
 * por eso NO se manda senderId.
 */
export function sendChatMessage(
  input: SendChatMessageInput,
): Promise<SendChatMessageResult> {
  return new Promise((resolve) => {
    const content = input.content.trim();
    if (!content) {
      resolve({ success: false, error: 'El mensaje no puede estar vacío' });
      return;
    }

    const socket = getChatSocket();
    if (!socket.connected) {
      resolve({ success: false, error: 'Sin conexión con el chat' });
      return;
    }

    socket
      .timeout(SEND_TIMEOUT_MS)
      .emit(
        'chat:send',
        { conversationId: input.conversationId, content },
        (err: Error | null, response?: SendChatMessageResult) => {
          if (err) {
            resolve({ success: false, error: 'Tiempo de espera agotado' });
            return;
          }
          resolve(response ?? { success: false, error: 'Sin respuesta del servidor' });
        },
      );
  });
}