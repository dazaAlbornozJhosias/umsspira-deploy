'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { sendChatMessage } from '@/shared/services/chat-message.service';
import {
  getConversationMessages,
  getConversationMessagesPage,
  markConversationAsRead,
  type ChatMessage,
  type ConversationSummary,
} from '@/shared/services/chat-conversation.service';
import { getInitials } from '../utils/format';
import { formatDayLabel, shouldShowDaySeparator } from '../utils/history';
import { emitUnreadRefresh } from '../utils/unread-events';
import { getChatSocket } from '@/shared/services/chat-socket';

type IncomingChatMessage = ChatMessage & {
  id_conversacion: string;
};

function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const unique = new Map<string, ChatMessage>();

  for (const message of [...current, ...incoming]) {
    unique.set(message.id, message);
  }

  const timestamp = (value: string | null): number => {
    if (!value) return 0;

    const time = Date.parse(value);
    return Number.isNaN(time) ? 0 : time;
  };

  return Array.from(unique.values()).sort(
    (a, b) =>
      timestamp(a.fecha_mensaje) - timestamp(b.fecha_mensaje) ||
      a.id.localeCompare(b.id),
  );
}

interface Props {
  conversation: ConversationSummary;
  onBack: () => void;
}

export const ConversationPanel = ({ conversation, onBack }: Props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const sendingRef = useRef(false);
  const requestVersionRef = useRef(0);

  // Control del desplazamiento del historial.
  const historyRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(null);
  const hasMoreHistoryRef = useRef(false);
  const loadingOlderRef = useRef(false);

  const pendingScrollRef = useRef<{
    height: number;
    top: number;
  } | null>(null);

  const { otherUser } = conversation;

  // HU-08: carga la página anterior de mensajes (CA-03)
  const loadOlderMessages = async () => {
    const container = historyRef.current;
    const cursor = nextCursorRef.current;

    if (
      !container ||
      !cursor ||
      !hasMoreHistoryRef.current ||
      loadingOlderRef.current
    ) {
      return;
    }

    const version = requestVersionRef.current;
    const previousHeight = container.scrollHeight;
    const previousTop = container.scrollTop;

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    setHistoryLoadError(null);

    try {
      const page = await getConversationMessagesPage(conversation.id, {
        limit: 15,
        beforeId: cursor,
      });

      if (requestVersionRef.current !== version) return;

      pendingScrollRef.current = {
        height: previousHeight,
        top: previousTop,
      };

      nextCursorRef.current = page.nextCursor;
      hasMoreHistoryRef.current = page.hasMore;

      setHasMoreHistory(page.hasMore);

      setMessages((current) => mergeMessages(page.messages, current));
    } catch (err: unknown) {
      if (requestVersionRef.current === version) {
        setHistoryLoadError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los mensajes anteriores',
        );
      }
    } finally {
      if (requestVersionRef.current === version) {
        loadingOlderRef.current = false;
        setLoadingOlder(false);
      }
    }
  };

  const handleHistoryScroll = () => {
    const container = historyRef.current;
    if (!container) return;

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    isAtBottomRef.current = distanceToBottom <= 48;

    if (isAtBottomRef.current) {
      setHasNewMessages(false);
    }

    if (container.scrollTop <= 60) {
      void loadOlderMessages();
    }
  };

  const goToLatest = () => {
    const container = historyRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
    isAtBottomRef.current = true;
    setHasNewMessages(false);
  };

  useEffect(() => {
    const version = ++requestVersionRef.current;
    const socket = getChatSocket();

    isAtBottomRef.current = true;
    seenMessageIdsRef.current = new Set();
    setHasNewMessages(false);
    sendingRef.current = false;

    setMessages([]);
    setLoading(true);
    nextCursorRef.current = null;
    hasMoreHistoryRef.current = false;
    loadingOlderRef.current = false;
    pendingScrollRef.current = null;

    setHasMoreHistory(false);
    setLoadingOlder(false);
    setHistoryLoadError(null);
    setError(null);
    setDraft('');
    setSending(false);
    setSendError(null);

    // HU-07 CA-02/CA-04: con la conversación abierta, lo recibido se marca como leído
    // y la barra superior recalcula su insignia.
    const markRead = () => {
      markConversationAsRead(conversation.id)
        .catch(() => undefined)
        .finally(emitUnreadRefresh);
    };

    const onNewMessage = (message: IncomingChatMessage) => {
      if (requestVersionRef.current !== version) return;
      if (message.id_conversacion !== conversation.id) return;

      setMessages((current) => mergeMessages(current, [message]));
      if (message.emisor_id === otherUser.id) markRead();
    };

    // Escuchar antes de cargar el historial evita perder
    // mensajes que lleguen mientras termina la consulta.
    socket.on('chat:new_message', onNewMessage);

    getConversationMessagesPage(conversation.id, { limit: 15 })
      .then((page) => {
        if (requestVersionRef.current !== version) return;

        nextCursorRef.current = page.nextCursor;
        hasMoreHistoryRef.current = page.hasMore;

        setHasMoreHistory(page.hasMore);
        setMessages((current) => mergeMessages(current, page.messages));
        markRead();
      })
      .catch((err: unknown) => {
        if (requestVersionRef.current === version) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar los mensajes',
          );
        }
      })
      .finally(() => {
        if (requestVersionRef.current === version) {
          setLoading(false);
        }
      });

    return () => {
      requestVersionRef.current++;
      socket.off('chat:new_message', onNewMessage);
    };
  }, [conversation.id]);

  // Bajar al abrir el historial y cuando llegan mensajes
  // si el usuario ya estaba al final.
  useLayoutEffect(() => {
    if (loading) return;

    const container = historyRef.current;
    if (!container) return;

    const pendingScroll = pendingScrollRef.current;

    if (pendingScroll) {
      pendingScrollRef.current = null;

      seenMessageIdsRef.current = new Set(
        messages.map((message) => message.id),
      );

      container.scrollTop =
        container.scrollHeight - pendingScroll.height + pendingScroll.top;

      return;
    }

    const addedMessages = messages.filter(
      (message) => !seenMessageIdsRef.current.has(message.id),
    );

    seenMessageIdsRef.current = new Set(messages.map((message) => message.id));

    if (isAtBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      setHasNewMessages(false);
      return;
    }

    const receivedNewMessage = addedMessages.some(
      (message) => message.emisor_id === otherUser.id,
    );

    if (receivedNewMessage) {
      setHasNewMessages(true);
    }
  }, [messages, loading, otherUser.id]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = draft.trim();

    if (!content || sendingRef.current || loading || error) {
      return;
    }

    const version = requestVersionRef.current;
    const conversationId = conversation.id;

    sendingRef.current = true;
    setSending(true);
    setSendError(null);

    try {
      const result = await sendChatMessage({
        conversationId,
        content,
      });

      if (requestVersionRef.current !== version) return;

      if (!result.success) {
        setSendError(result.error ?? 'No se pudo enviar el mensaje');
        return;
      }

      setDraft('');

      try {
        const updatedMessages = await getConversationMessages(conversationId);

        if (requestVersionRef.current === version) {
          setMessages((current) => mergeMessages(current, updatedMessages));
        }
      } catch {
        if (requestVersionRef.current === version) {
          setSendError(
            'El mensaje se envió, pero no se pudo actualizar el historial. Abre nuevamente la conversación.',
          );
        }
      }
    } catch {
      if (requestVersionRef.current === version) {
        setSendError(
          'No se pudo confirmar el envío. Revisa la conversación antes de reintentar.',
        );
      }
    } finally {
      if (requestVersionRef.current === version) {
        sendingRef.current = false;
        setSending(false);
      }
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a mis conversaciones"
          className="rounded-lg p-2 text-slate-600 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F172A] text-xs font-semibold text-white">
          {getInitials(otherUser.name)}
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {otherUser.name}
          </p>
          <p className="text-xs capitalize text-slate-500">{otherUser.role}</p>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={historyRef}
          onScroll={handleHistoryScroll}
          aria-label="Historial de mensajes"
          aria-busy={loading}
          className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 [overflow-anchor:none]"
        >
          {loading && (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando mensajes...
            </div>
          )}

          {error && (
            <p role="alert" className="text-center text-sm text-red-700">
              {error}
            </p>
          )}

          {/* HU-08: franja superior de alto fijo (evita saltos al cargar páginas) */}
          {!loading && !error && messages.length > 0 && (
            <div className="flex h-8 items-center justify-center text-xs">
              {loadingOlder ? (
                <span
                  role="status"
                  className="flex items-center gap-2 text-slate-500"
                >
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Cargando mensajes anteriores...
                </span>
              ) : historyLoadError ? (
                <span
                  role="alert"
                  className="flex items-center gap-2 text-red-700"
                >
                  {historyLoadError}
                  <button
                    type="button"
                    onClick={() => void loadOlderMessages()}
                    className="rounded-lg px-2 py-1 font-semibold underline"
                  >
                    Reintentar
                  </button>
                </span>
              ) : hasMoreHistory ? (
                <button
                  type="button"
                  onClick={() => void loadOlderMessages()}
                  className="min-h-8 rounded-full bg-[#FFB162] px-3 py-1 font-semibold text-[#0F172A] hover:bg-[#FFA348]"
                >
                  ↑ Cargar mensajes anteriores
                </button>
              ) : (
                <span className="text-slate-400">
                  No hay mensajes anteriores
                </span>
              )}
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              Aún no hay mensajes. Inicia la conversación.
            </p>
          )}

          {messages.map((message, index) => {
            const mine = message.emisor_id !== otherUser.id;
            const previous = index > 0 ? messages[index - 1] : null;
            const showSeparator = shouldShowDaySeparator(
              previous?.fecha_mensaje,
              message.fecha_mensaje,
              index === 0,
            );
            const dayLabel = formatDayLabel(message.fecha_mensaje);
            const isStartOfConversation = index === 0 && !hasMoreHistory;

            return (
              <div key={message.id} className="space-y-2">
                {showSeparator && (
                  <p className="py-1 text-center text-[11px] text-slate-400">
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {isStartOfConversation
                        ? `Inicio de la conversación · ${dayLabel}`
                        : dayLabel}
                    </span>
                  </p>
                )}

                <div
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`min-w-0 max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? 'bg-[#0F172A] text-white'
                        : 'border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.contenido}
                    </p>

                    <p
                      className={`mt-1 text-right text-[10px] ${
                        mine ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {message.fecha_mensaje
                        ? new Date(message.fecha_mensaje).toLocaleTimeString(
                            'es-BO',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            },
                          )
                        : 'Sin hora'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {hasNewMessages && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
            <button
              type="button"
              onClick={goToLatest}
              className="pointer-events-auto min-h-11 rounded-full border border-orange-300 bg-[#FFB162] px-4 py-2 text-sm font-semibold text-[#0F172A] shadow-lg hover:bg-[#FFA348] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              <span role="status">Mensajes nuevos</span>
              <span aria-hidden="true"> · </span>
              Ir al final ↓
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-slate-200 bg-white p-4"
      >
        {sendError && (
          <p role="alert" className="mb-2 text-sm text-red-700">
            {sendError}
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            aria-label="Escribir mensaje"
            placeholder="Escribe un mensaje..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={sending || loading || Boolean(error)}
            className="min-h-11 min-w-0 flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
          />

          <button
            type="submit"
            aria-label={sending ? 'Enviando mensaje' : 'Enviar mensaje'}
            disabled={sending || loading || Boolean(error) || !draft.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F172A] text-white transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};