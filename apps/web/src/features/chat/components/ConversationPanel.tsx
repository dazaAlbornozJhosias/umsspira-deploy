"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ArrowLeft, Send, Loader2, Paperclip, Download, X } from "lucide-react";
import {
  deleteChatMessage,
  editChatMessage,
  getConversationMessagesPage,
  markConversationAsRead,
  respondToChatRequest,
  sendChatAttachment,
  downloadChatAttachment,
  type ChatMessage,
  type ConversationSummary,
} from "@/shared/services/chat-conversation.service";
import { sendChatMessage } from "@/shared/services/chat-message.service";
import { getChatSocket } from "@/shared/services/chat-socket";
import { formatDayLabel, shouldShowDaySeparator } from "../utils/history";
import { emitUnreadRefresh } from "../utils/unread-events";

const merge = (current: ChatMessage[], incoming: ChatMessage[]) =>
  Array.from(
    new Map(
      [...current, ...incoming].map((message) => [message.id, message]),
    ).values(),
  ).sort(
    (a, b) => a.sentAt.localeCompare(b.sentAt) || a.id.localeCompare(b.id),
  );

export function ConversationPanel({
  conversation,
  actorId,
  onBack,
  onChange,
}: {
  conversation: ConversationSummary;
  actorId: string;
  onBack: () => void;
  onChange: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [olderBusy, setOlderBusy] = useState(false);
  const [newMessages, setNewMessages] = useState(false);
  const pending = useRef<{ content: string; clientId: string } | null>(null);
  const busyRef = useRef(false),
    mounted = useRef(true),
    loadVersion = useRef(0);
  const known = useRef<ChatMessage[]>([]);
  const history = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const previousScroll = useRef<{ top: number; height: number } | null>(null);
  const readId = useRef<string | null>(null);
  const accepted = conversation.status === "ACEPTADO";
  const incoming = conversation.requesterId !== actorId;

  const refresh = useCallback(async () => {
    const version = ++loadVersion.current;
    try {
      const page = await getConversationMessagesPage(conversation.id);
      const items = [...page.items];
      // Recuperar también los mensajes intermedios si el corte duró varias páginas.
      let before = page.nextCursor;
      const previousIds = new Set(known.current.map((message) => message.id));
      const oldestLoadedId = known.current[0]?.id;
      while (
        previousIds.size &&
        before &&
        !items.some((message) => message.id === oldestLoadedId)
      ) {
        const older = await getConversationMessagesPage(
          conversation.id,
          before,
        );
        items.unshift(...older.items);
        before = older.nextCursor;
      }
      if (!mounted.current || version !== loadVersion.current) return;
      if (
        !atBottom.current &&
        items.some((message) => !previousIds.has(message.id))
      )
        setNewMessages(true);
      if (!known.current.length) setCursor(page.nextCursor);
      setMessages((current) => {
        const result = merge(current, items);
        known.current = result;
        return result;
      });
      setError(null);
    } catch (error) {
      if (mounted.current && version === loadVersion.current)
        setError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el historial",
        );
    } finally {
      if (mounted.current && version === loadVersion.current) setLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const socket = getChatSocket();
    let debounce: ReturnType<typeof setTimeout>;
    const schedule = (event?: { conversationId: string }) => {
      if (event && event.conversationId !== conversation.id) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        void refresh();
      }, 150);
    };
    const reconnect = () => schedule();
    socket.on("chat:changed", schedule);
    socket.on("connect", reconnect);
    window.addEventListener("focus", reconnect);
    const timer = setInterval(reconnect, 15000);
    const invalidate = () => {
      loadVersion.current++;
    };
    return () => {
      mounted.current = false;
      invalidate();
      clearTimeout(debounce);
      clearInterval(timer);
      socket.off("chat:changed", schedule);
      socket.off("connect", reconnect);
      window.removeEventListener("focus", reconnect);
    };
  }, [conversation.id, refresh]);

  const lastMessageId = messages.at(-1)?.id;
  useEffect(() => {
    const mark = () => {
      if (
        document.visibilityState !== "visible" ||
        !lastMessageId ||
        readId.current === lastMessageId
      )
        return;
      readId.current = lastMessageId;
      void markConversationAsRead(conversation.id, lastMessageId)
        .then(emitUnreadRefresh)
        .catch(() => {
          readId.current = null;
        });
    };
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [conversation.id, lastMessageId]);

  useLayoutEffect(() => {
    const container = history.current;
    if (!container) return;
    if (previousScroll.current) {
      container.scrollTop =
        previousScroll.current.top +
        container.scrollHeight -
        previousScroll.current.height;
      previousScroll.current = null;
    } else if (atBottom.current) container.scrollTop = container.scrollHeight;
  }, [messages]);

  const loadOlder = async () => {
    if (!cursor || olderBusy) return;
    setOlderBusy(true);
    try {
      const page = await getConversationMessagesPage(conversation.id, cursor);
      if (!mounted.current) return;
      if (history.current)
        previousScroll.current = {
          top: history.current.scrollTop,
          height: history.current.scrollHeight,
        };
      setMessages((current) => {
        const result = merge(current, page.items);
        known.current = result;
        return result;
      });
      setCursor(page.nextCursor);
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el historial",
        );
    } finally {
      if (mounted.current) setOlderBusy(false);
    }
  };

  const run = async (work: () => Promise<unknown>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await work();
      if (mounted.current) {
        onChange();
        emitUnreadRefresh();
      }
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof Error
            ? error.message
            : "No fue posible completar la operación",
        );
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if ((!content && !attachment) || content.length > 500 || !accepted) return;
    void run(async () => {
      let message: ChatMessage;
      if (editing)
        message = await editChatMessage(conversation.id, editing, content);
      else {
        if (!pending.current || pending.current.content !== content)
          pending.current = { content, clientId: crypto.randomUUID() };
        message = attachment
          ? await sendChatAttachment(
              conversation.id,
              attachment,
              pending.current,
            )
          : await sendChatMessage({
              conversationId: conversation.id,
              ...pending.current,
            });
      }
      if (!mounted.current) return;
      pending.current = null;
      setDraft("");
      setEditing(null);
      atBottom.current = true;
      setAttachment(null);
      if (fileInput.current) fileInput.current.value = "";
      setMessages((current) => {
        const result = merge(current, [message]);
        known.current = result;
        return result;
      });
    });
  };
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
        <button
          aria-label="Volver a conversaciones"
          className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-semibold text-slate-900">
            {conversation.otherUser.name}
          </h2>
          <p className="text-xs capitalize text-slate-500">
            {conversation.otherUser.role}
          </p>
        </div>
        <span className="ml-auto text-xs text-slate-500">
          {accepted ? "Conversación" : "Solicitud"}
        </span>
      </header>
      {!accepted && (
        <section className="border-b border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
          <p>
            {conversation.status === "RECHAZADO"
              ? incoming
                ? "Rechazaste esta solicitud. Puedes aceptarla si cambias de opinión."
                : "Esta solicitud no fue aceptada. No puedes enviar más mensajes."
              : incoming
                ? "Esta persona quiere conversar contigo. Lee su mensaje y decide si deseas continuar."
                : "Solicitud enviada. Podrás escribir de nuevo cuando la otra persona la acepte."}
          </p>
          {incoming && (
            <div className="mt-3 flex gap-2">
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await respondToChatRequest(conversation.id, "accept");
                  })
                }
                className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                Aceptar conversación
              </button>
              {conversation.status === "PENDIENTE" && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await respondToChatRequest(conversation.id, "decline");
                    })
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2"
                >
                  Rechazar
                </button>
              )}
            </div>
          )}
        </section>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 bg-red-50 p-3 text-sm text-red-800"
        >
          <span>{error}</span>
          <button onClick={() => void refresh()} className="underline">
            Actualizar
          </button>
        </div>
      )}
      <div
        ref={history}
        role="log"
        aria-label="Historial de mensajes"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4"
        onScroll={() => {
          const container = history.current;
          if (container) {
            atBottom.current =
              container.scrollHeight -
                container.scrollTop -
                container.clientHeight <
              70;
            if (atBottom.current) setNewMessages(false);
          }
        }}
      >
        {loading && (
          <p role="status" className="p-4 text-center text-sm">
            Cargando mensajes…
          </p>
        )}
        {!loading &&
          (cursor ? (
            <button
              disabled={olderBusy}
              onClick={() => void loadOlder()}
              className="mx-auto block rounded-lg border bg-white px-4 py-2 text-xs"
            >
              {olderBusy ? "Cargando…" : "Cargar mensajes anteriores"}
            </button>
          ) : (
            <p className="text-center text-xs text-slate-400">
              Inicio de la conversación
            </p>
          ))}
        {messages.map((message, index) => (
          <div key={message.id}>
            {shouldShowDaySeparator(
              messages[index - 1]?.sentAt,
              message.sentAt,
              index === 0,
            ) && (
              <p className="my-4 text-center text-xs text-slate-500">
                {formatDayLabel(message.sentAt)}
              </p>
            )}
            <article
              className={`flex ${message.senderId === actorId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${message.senderId === actorId ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-900"}`}
              >
                <p
                  className={`whitespace-pre-wrap break-words text-sm ${message.deletedAt ? "italic opacity-60" : ""}`}
                >
                  {message.deletedAt ? "Mensaje eliminado" : message.content}
                </p>
                {message.attachment && !message.deletedAt && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(() =>
                        downloadChatAttachment(
                          conversation.id,
                          message.id,
                          message.attachment!.name,
                        ),
                      )
                    }
                    className="mt-2 flex max-w-full items-center gap-2 rounded-lg border border-current/20 p-3 text-left text-xs"
                  >
                    <Download size={16} className="shrink-0" />
                    <span className="min-w-0 break-all">
                      {message.attachment.name}
                      <span className="block opacity-60">
                        {(message.attachment.size / 1024).toFixed(0)} KB ·
                        Descargar
                      </span>
                    </span>
                  </button>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-[11px] opacity-75">
                  <time dateTime={message.sentAt}>
                    {new Date(message.sentAt).toLocaleTimeString("es-BO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  {message.editedAt && !message.deletedAt && (
                    <span>Editado</span>
                  )}
                  {message.senderId === actorId && !message.deletedAt && (
                    <>
                      {accepted && message.content && (
                        <button
                          disabled={busy}
                          aria-label="Editar mensaje"
                          className="underline"
                          onClick={() => {
                            setAttachment(null);
                            setEditing(message.id);
                            setDraft(message.content);
                          }}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        disabled={busy}
                        aria-label="Eliminar mensaje"
                        className="underline"
                        onClick={() => setDeleting(message.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
                {deleting === message.id && (
                  <div className="mt-3 text-xs">
                    <p>¿Eliminar este mensaje para ambos?</p>
                    <div className="mt-2 flex gap-3">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const result = await deleteChatMessage(
                              conversation.id,
                              message.id,
                            );
                            if (mounted.current) {
                              setMessages((current) =>
                                merge(current, [result]),
                              );
                              setDeleting(null);
                            }
                          })
                        }
                        className="underline"
                      >
                        Eliminar para ambos
                      </button>
                      <button onClick={() => setDeleting(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>
        ))}
      </div>
      {newMessages && (
        <button
          className="bg-orange-100 py-2 text-sm text-orange-900"
          onClick={() => {
            atBottom.current = true;
            if (history.current)
              history.current.scrollTop = history.current.scrollHeight;
            setNewMessages(false);
          }}
        >
          Nuevos mensajes · Ir al final
        </button>
      )}
      {accepted && (
        <form onSubmit={submit} className="border-t bg-white p-3">
          {attachment && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-orange-50 p-2 text-xs">
              <span className="truncate">
                {attachment.name} · {(attachment.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                disabled={busy}
                aria-label="Quitar archivo"
                onClick={() => {
                  setAttachment(null);
                  pending.current = null;
                  if (fileInput.current) fileInput.current.value = "";
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {editing && (
            <div className="mb-2 flex justify-between text-xs text-slate-600">
              <span>Editando mensaje</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditing(null);
                  setDraft("");
                }}
              >
                Cancelar edición
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInput}
              type="file"
              aria-label="Seleccionar archivo"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.pptx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && file.size > 10 * 1024 * 1024) {
                  setError("El archivo supera el límite de 10 MB");
                  event.target.value = "";
                  return;
                }
                setAttachment(file ?? null);
                pending.current = null;
              }}
            />
            {!editing && (
              <button
                type="button"
                disabled={busy}
                aria-label="Adjuntar archivo"
                onClick={() => fileInput.current?.click()}
                className="rounded-xl border p-3"
              >
                <Paperclip size={20} />
              </button>
            )}
            <textarea
              aria-label={
                editing ? "Editar texto del mensaje" : "Escribe un mensaje"
              }
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={500}
              rows={2}
              disabled={busy}
              placeholder="Escribe un mensaje…"
              className="min-h-12 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              aria-label={editing ? "Guardar cambios" : "Enviar mensaje"}
              disabled={busy || loading || (!draft.trim() && !attachment)}
              className="rounded-xl bg-slate-900 p-3 text-white disabled:opacity-40"
            >
              {busy ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>
              {busy
                ? attachment
                  ? "Subiendo archivo…"
                  : "Guardando…"
                : "Archivos de hasta 10 MB · Conversación privada"}
            </span>
            <span>{draft.length}/500</span>
          </div>
        </form>
      )}
    </div>
  );
}
