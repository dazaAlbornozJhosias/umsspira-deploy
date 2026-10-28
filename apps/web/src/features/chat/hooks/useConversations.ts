// apps/web/src/features/chat/hooks/useConversations.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getMyConversations,
  type ConversationSummary,
} from '@/shared/services/chat-conversation.service';

export const useConversations = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      setConversations(await getMyConversations());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar tus conversaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  return {
    conversations,
    loading,
    error,
    // Recarga sin parpadeo: se usará al enviar o recibir un mensaje (CA-03)
    reload: () => load(false),
    // Reintento tras un error: muestra el indicador de carga
    retry: () => load(true),
  };
};