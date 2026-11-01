"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getUnreadSummary,
  type ConversationSummary,
} from "@/shared/services/chat-conversation.service";
import {
  retainChatSocket,
  releaseChatSocket,
} from "@/shared/services/chat-socket";
import { onUnreadRefresh } from "../utils/unread-events";
export const UNREAD_PANEL_LIMIT = 5;
export type UnreadConversation = ConversationSummary & { unreadCount: number };
export interface UnreadSummary {
  total: number;
  conversations: UnreadConversation[];
}
export const buildUnreadSummary = (
  items: ConversationSummary[],
  limit = UNREAD_PANEL_LIMIT,
): UnreadSummary => {
  const unread = items.filter(
    (item) => item.unreadCount > 0 && item.status !== "RECHAZADO",
  );
  return {
    total: unread.reduce((sum, item) => sum + item.unreadCount, 0),
    conversations: [...unread]
      .sort(
        (a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt),
      )
      .slice(0, limit),
  };
};
export const useUnreadSummary = () => {
  const [summary, setSummary] = useState<UnreadSummary>({
    total: 0,
    conversations: [],
  });
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const result = await getUnreadSummary();
      if (request === version.current) setSummary(result);
    } catch {
      /* Conservar el resumen durante cortes de red. */
    }
  }, []);
  useEffect(() => {
    void refresh();
    const socket = retainChatSocket();
    let debounce: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        void refresh();
      }, 250);
    };
    socket.on("chat:changed", schedule);
    socket.on("connect", schedule);
    window.addEventListener("focus", schedule);
    const stop = onUnreadRefresh(schedule),
      timer = setInterval(schedule, 30000);
    const invalidate = () => {
      version.current++;
    };
    return () => {
      invalidate();
      clearTimeout(debounce);
      clearInterval(timer);
      stop();
      socket.off("chat:changed", schedule);
      socket.off("connect", schedule);
      window.removeEventListener("focus", schedule);
      releaseChatSocket();
    };
  }, [refresh]);
  return { summary, reload: refresh };
};
