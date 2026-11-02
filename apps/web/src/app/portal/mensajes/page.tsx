"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Plus, RefreshCw } from "lucide-react";
import { authenticatedFetch } from "@/shared/services/auth-session";
import {
  getConversation,
  type ConversationSummary,
} from "@/shared/services/chat-conversation.service";
import { getChatSocket, retryConnection } from "@/shared/services/chat-socket";
import { useConversations } from "@/features/chat/hooks/useConversations";
import { ConversationPanel } from "@/features/chat/components/ConversationPanel";
import { ComposeRequest } from "@/features/chat/components/ComposeRequest";
import { formatChatTime, getInitials } from "@/features/chat/utils/format";

type Tab = "inbox" | "requests" | "declined";
function Messages() {
  const params = useSearchParams();
  const { conversations, loading, error, reload } = useConversations();
  const [actorId, setActorId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    params.get("conversation"),
  );
  const [external, setExternal] = useState<ConversationSummary | null>(null);
  const [compose, setCompose] = useState(Boolean(params.get("recipient")));
  const [tab, setTab] = useState<Tab>("inbox");
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState("");
  const selected =
    conversations.find((item) => item.id === selectedId) ??
    (external?.id === selectedId ? external : null);
  useEffect(() => {
    let active = true;
    void authenticatedFetch("/api/v1/user/me")
      .then(async (response) => {
        if (!response.ok) throw new Error("session");
        const result = (await response.json()) as { data: { id: string } };
        if (active) setActorId(result.data.id);
      })
      .catch(() => {
        if (active) setSessionError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setSelectedId(params.get("conversation"));
    setCompose(Boolean(params.get("recipient")));
  }, [params]);
  useEffect(() => {
    if (!selectedId || conversations.some((item) => item.id === selectedId))
      return;
    let active = true;
    void getConversation(selectedId)
      .then((value) => {
        if (active) setExternal(value);
      })
      .catch(() => {
        if (active)
          setNotice(
            "No se pudo abrir la conversación. Comprueba que participas en ella.",
          );
      });
    return () => {
      active = false;
    };
  }, [selectedId, conversations]);
  useEffect(() => {
    const socket = getChatSocket();
    setConnected(socket.connected);
    const online = () => setConnected(true),
      offline = () => setConnected(false);
    socket.on("connect", online);
    socket.on("disconnect", offline);
    socket.on("connect_error", offline);
    return () => {
      socket.off("connect", online);
      socket.off("disconnect", offline);
      socket.off("connect_error", offline);
    };
  }, []);
  const select = (id: string) => {
    setSelectedId(id);
    setCompose(false);
    setNotice("");
    window.history.replaceState(
      null,
      "",
      `/portal/mensajes?conversation=${encodeURIComponent(id)}`,
    );
  };
  const incoming = (item: ConversationSummary) => item.requesterId !== actorId;
  const requests = conversations.filter(
    (item) => item.status === "PENDIENTE" && incoming(item),
  );
  const visible = conversations.filter((item) =>
    tab === "requests"
      ? item.status === "PENDIENTE" && incoming(item)
      : tab === "declined"
        ? item.status === "RECHAZADO"
        : item.status === "ACEPTADO" ||
          (item.status === "PENDIENTE" && !incoming(item)),
  );
  if (sessionError)
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p>No fue posible comprobar tu sesión.</p>
        <a href="/login" className="underline">
          Iniciar sesión
        </a>
      </div>
    );
  return (
    <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
          <p className="text-sm text-slate-500">
            Conecta con tu comunidad profesional
          </p>
        </div>
      </div>
      {!connected && !loading && actorId && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p role="status">Reconectando el chat…</p>
          <button
            onClick={() => {
              retryConnection();
              void reload();
            }}
            className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold"
            aria-label="Reintentar conexión del chat"
          >
            <RefreshCw size={14} />
            Reintentar
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="mb-3 rounded-lg bg-orange-50 p-3 text-sm">
          {notice}
        </p>
      )}
      <div className="grid h-[75dvh] min-h-[450px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[340px_1fr]">
        <aside
          className={`min-h-0 flex-col border-r ${selectedId || compose ? "hidden md:flex" : "flex"}`}
        >
          <div className="p-4">
            <button
              onClick={() => {
                setCompose(true);
                setSelectedId(null);
                setNotice("");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              <Plus size={18} />
              Nuevo mensaje
            </button>
          </div>
          <nav aria-label="Bandejas de mensajes" className="flex border-b px-2">
            {(
              [
                ["inbox", "Chats"],
                [
                  "requests",
                  `Solicitudes${requests.length ? ` (${requests.length})` : ""}`,
                ],
                ["declined", "Rechazadas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
                className={`flex-1 border-b-2 px-2 py-3 text-xs font-semibold ${tab === value ? "border-orange-400 text-slate-900" : "border-transparent text-slate-500"}`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-auto">
            {(loading || !actorId) && (
              <p role="status" className="p-5 text-sm text-slate-500">
                Cargando conversaciones…
              </p>
            )}
            {error && (
              <div role="alert" className="p-4 text-sm text-red-700">
                {error}
                <button
                  className="ml-2 underline"
                  onClick={() => void reload()}
                >
                  Reintentar
                </button>
              </div>
            )}
            {!loading && actorId && !visible.length && (
              <div className="p-8 text-center text-sm text-slate-500">
                <MessageSquare className="mx-auto mb-3" />
                {tab === "inbox"
                  ? "Inicia una conversación con tu primer mensaje."
                  : "No tienes solicitudes en esta bandeja."}
              </div>
            )}
            {actorId &&
              visible.map((item) => (
                <button
                  key={item.id}
                  onClick={() => select(item.id)}
                  aria-current={selectedId === item.id ? "true" : undefined}
                  className={`flex w-full gap-3 border-b border-b-slate-100 border-l-4 p-4 text-left hover:bg-orange-50 ${selectedId === item.id ? "border-l-orange-500 bg-orange-50" : "border-l-transparent"}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                    {getInitials(item.otherUser.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <strong className="truncate text-sm">
                        {item.otherUser.name}
                      </strong>
                      <time className="shrink-0 text-[10px] text-slate-400">
                        {formatChatTime(item.lastMessage?.sentAt)}
                      </time>
                    </span>
                    <span className="block text-[11px] capitalize text-slate-500">
                      {item.otherUser.role}
                      {item.status === "PENDIENTE" && !incoming(item)
                        ? " · Solicitud enviada"
                        : ""}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {item.lastMessage?.deletedAt
                        ? "Mensaje eliminado"
                        : item.lastMessage?.content ||
                          item.lastMessage?.attachment?.name}
                    </span>
                  </span>
                  {item.unreadCount > 0 && (
                    <span
                      aria-label={`${item.unreadCount} sin leer`}
                      className="my-auto rounded-full bg-orange-200 px-2 py-1 text-xs font-bold"
                    >
                      {item.unreadCount}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </aside>
        <section
          className={`min-h-0 min-w-0 ${selectedId || compose ? "block" : "hidden md:block"}`}
        >
          {compose ? (
            <ComposeRequest
              key={params.get("recipient") ?? "new"}
              recipientId={params.get("recipient") ?? undefined}
              onCancel={() => {
                setCompose(false);
                window.history.replaceState(null, "", "/portal/mensajes");
              }}
              onCreated={(id, created) => {
                select(id);
                if (!created)
                  setNotice(
                    "Ya existe una conversación con esta persona. Se abrió sin enviar otro mensaje.",
                  );
                void reload();
              }}
            />
          ) : selected && actorId ? (
            <ConversationPanel
              key={selected.id}
              conversation={selected}
              actorId={actorId}
              onBack={() => {
                setSelectedId(null);
                window.history.replaceState(null, "", "/portal/mensajes");
              }}
              onChange={() => {
                void reload();
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
              <MessageSquare size={40} strokeWidth={1} />
              <p className="font-semibold">
                Tu próxima conversación empieza aquí
              </p>
              <p className="max-w-sm text-sm">
                Envía una solicitud a cualquier persona de la comunidad o retoma
                uno de tus chats.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="p-6">Cargando mensajes…</p>}>
      <Messages />
    </Suspense>
  );
}
