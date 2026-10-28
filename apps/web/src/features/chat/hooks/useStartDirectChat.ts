// apps/web/src/features/chat/hooks/useStartDirectChat.ts
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startDirectChat } from '@/shared/services/chat-conversation.service';

export const useStartDirectChat = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startChat = async (targetUserId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { conversationId } = await startDirectChat(targetUserId);
      router.push(`/portal/mensajes?conversation=${conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar el chat');
    } finally {
      setLoading(false);
    }
  };

  return {
    startChat,
    loading,
    error,
    clearError: () => setError(null),
  };
};