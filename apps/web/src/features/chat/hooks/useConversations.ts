"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMyConversations,
  type ConversationSummary,
} from "@/shared/services/chat-conversation.service";
import {
  retainChatSocket,
  releaseChatSocket,
} from "@/shared/services/chat-socket";
import { onUnreadRefresh } from "../utils/unread-events";
export const useConversations = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const load = useCallback(async () => {
    const request = ++version.current;
    try {
      const items = await getMyConversations();
      if (request === version.current) {
        setConversations(items);
        setError(null);
      }
    } catch (error) {
      if (request === version.current)
        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los mensajes",
        );
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const socket = retainChatSocket();
    const refresh = () => {
      void load();
    };
    socket.on("chat:changed", refresh);
    socket.on("connect", refresh);
    const stop = onUnreadRefresh(refresh);
    window.addEventListener("focus", refresh);
    const timer = setInterval(refresh, 15000);
    const invalidate = () => {
      version.current++;
    };
    return () => {
      invalidate();
      socket.off("chat:changed", refresh);
      socket.off("connect", refresh);
      window.removeEventListener("focus", refresh);
      clearInterval(timer);
      stop();
      releaseChatSocket();
    };
  }, [load]);
  return { conversations, loading, error, reload: load, retry: load };
};
