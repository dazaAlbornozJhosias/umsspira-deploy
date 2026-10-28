// apps/web/src/features/chat/hooks/useUnreadSummary.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getMyConversations,
  type ConversationSummary,
} from '@/shared/services/chat-conversation.service';
import { releaseChatSocket, retainChatSocket } from '@/shared/services/chat-socket';
import { onUnreadRefresh } from '../utils/unread-events';

/** Cantidad de conversaciones que muestra el panel de la barra (HU-10 CA-04). */
export const UNREAD_PANEL_LIMIT = 5;
const REFRESH_DEBOUNCE_MS = 250;

export type UnreadConversation = ConversationSummary & { unreadCount: number };

export interface UnreadSummary {
  total: number;
  conversations: UnreadConversation[];
}

const EMPTY: UnreadSummary = { total: 0, conversations: [] };

const activity = (c: ConversationSummary): number => {
  const time = c.lastActivityAt ? Date.parse(c.lastActivityAt) : 0;
  return Number.isNaN(time) ? 0 : time;
};

/** Convierte la lista de conversaciones en el resumen de pendientes. */
export const buildUnreadSummary = (
  conversations: ConversationSummary[],
  limit = UNREAD_PANEL_LIMIT,
): UnreadSummary => {
  const unread = conversations
    .map((c) => ({ ...c, unreadCount: c.unreadCount ?? 0 }))
    .filter((c): c is UnreadConversation => c.unreadCount > 0);

  return {
    total: unread.reduce((sum, c) => sum + c.unreadCount, 0),
    conversations: [...unread].sort((a, b) => activity(b) - activity(a)).slice(0, limit),
  };
};

export const useUnreadSummary = () => {
  const [summary, setSummary] = useState<UnreadSummary>(EMPTY);
  const requestRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const request = ++requestRef.current;
    try {
      const conversations = await getMyConversations();
      if (request === requestRef.current) setSummary(buildUnreadSummary(conversations));
    } catch {
      // Sin sesión o sin red: se conserva lo último que se mostró.
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void refresh();
    }, REFRESH_DEBOUNCE_MS);
  }, [refresh]);

  useEffect(() => {
    void refresh();

    // CA-03: el socket está conectado en cualquier pantalla donde esté la barra.
    const socket = retainChatSocket();
    if (!socket.connected) socket.connect();

    socket.on('chat:new_message', scheduleRefresh);
    socket.on('connect', scheduleRefresh);
    const stopLocal = onUnreadRefresh(scheduleRefresh);
    window.addEventListener('focus', scheduleRefresh);

    return () => {
      socket.off('chat:new_message', scheduleRefresh);
      socket.off('connect', scheduleRefresh);
      stopLocal();
      window.removeEventListener('focus', scheduleRefresh);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      requestRef.current++;
      releaseChatSocket();
    };
  }, [refresh, scheduleRefresh]);

  return { summary, reload: refresh };
};