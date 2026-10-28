// apps/web/src/features/chat/hooks/useSendMessage.ts
import { useState } from 'react';
import {
  sendChatMessage,
  type SendChatMessageResult,
} from '@/shared/services/chat-message.service';

export const useSendMessage = () => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (
    conversationId: string,
    content: string,
  ): Promise<SendChatMessageResult> => {
    setSending(true);
    setError(null);

    const result = await sendChatMessage({ conversationId, content });

    if (!result.success) {
      setError(result.error ?? 'Error al enviar el mensaje');
    }

    setSending(false);
    return result;
  };

  return { send, sending, error };
};