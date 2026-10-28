// apps/web/src/app/portal/mensajes/page.tsx
'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Loader2,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { releaseChatSocket, retainChatSocket } from '@/shared/services/chat-socket';
import { useConversations } from '@/features/chat/hooks/useConversations';
import { ConversationList } from '@/features/chat/components/ConversationList';
import { ConversationPanel } from '@/features/chat/components/ConversationPanel';
import { startDirectChat } from '@/shared/services/chat-conversation.service';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'unauthorized';

function StatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <div
      className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-medium"
      role="status"
      aria-live="polite"
    >
      {status === 'connecting' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
          <span className="text-amber-700">Conectando...</span>
        </>
      )}
      {status === 'connected' && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span className="text-green-700">Conectado</span>
        </>
      )}
      {status === 'reconnecting' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
          <span className="text-amber-700">Reconectando...</span>
        </>
      )}
      {status === 'unauthorized' && (
        <>
          <Lock className="w-3.5 h-3.5 text-red-600" />
          <span className="text-red-700">Sesión no válida</span>
        </>
      )}
      {status === 'disconnected' && (
        <>
          <WifiOff className="w-3.5 h-3.5 text-red-600" />
          <span className="text-red-700">Desconectado</span>
        </>
      )}
    </div>
  );
}

interface ChatContact {
  usuario_id: string;
  nombre: string | null;
  rol: string | null;
}

function MensajesPageContent() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const unauthorizedRef = useRef(false);

  // HU-06: lista de conversaciones y conversación abierta
  const { conversations, loading, error: listError, retry: retryList } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  // HU-03 / HU-10: abre /portal/mensajes?conversation=<id>
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get('conversation');
  useEffect(() => {
    if (conversationParam) setSelectedId(conversationParam);
  }, [conversationParam]);

  // HU-03: «Nuevo chat» abre la búsqueda de contactos
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const startingRef = useRef(false);

  const handleStartChat = async () => {
    setShowContacts(true);
    setContactsLoading(true);
    setContactsError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/v1/chat/conversations/users`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Inicia sesión nuevamente para buscar contactos.'
            : 'No se pudieron cargar los contactos.',
        );
      }

      const data: ChatContact[] = await response.json();
      setContacts(data);
    } catch (error: unknown) {
      setContactsError(
        error instanceof Error ? error.message : 'No se pudieron cargar los contactos.',
      );
    } finally {
      setContactsLoading(false);
    }
  };

  const handleChooseContact = async (userId: string) => {
    if (startingRef.current) return;

    startingRef.current = true;
    setStartingUserId(userId);
    setContactsError(null);

    try {
      const { conversationId } = await startDirectChat(userId);

      // Recargar la lista permite encontrar y abrir la conversación creada.
      await retryList();
      setSelectedId(conversationId);

      const url = new URL(window.location.href);
      url.searchParams.set('conversation', conversationId);
      window.history.replaceState(null, '', url.toString());

      setShowContacts(false);
    } catch (error: unknown) {
      setContactsError(
        error instanceof Error ? error.message : 'No se pudo abrir la conversación.',
      );
    } finally {
      startingRef.current = false;
      setStartingUserId(null);
    }
  };

  // CA-05: el botón «Reintentar» abre una nueva conexión
  const retry = useCallback(() => {
    setIsRetrying(true);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    // HU-10: el socket es compartido con la barra superior (conteo de referencias)
    const socket = retainChatSocket();
    unauthorizedRef.current = false;
    setStatus('connecting'); // CA-03

    const onConnect = () => {
      setStatus('connected'); // CA-04
      setIsRetrying(false);
    };

    const onUnauthorized = () => {
      // CA-02: el servidor no me deja entrar por sesión no válida o vencida
      unauthorizedRef.current = true;
      setStatus('unauthorized');
      setIsRetrying(false);
    };

    const onConnectError = () => {
      if (!unauthorizedRef.current) setStatus('disconnected'); // CA-05
      setIsRetrying(false);
    };

    const onDisconnect = () => {
      if (!unauthorizedRef.current) setStatus('disconnected'); // CA-05
    };

    // Extra: feedback visual mientras el servidor intenta reconectar
    const onReconnectAttempt = () => {
      if (!unauthorizedRef.current) setStatus('reconnecting');
    };

    socket.on('connect', onConnect);
    socket.on('chat:unauthorized', onUnauthorized);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);

    // CA-01: iniciamos la conexión (o aprovechamos la que ya abrió la barra)
    if (socket.connected) onConnect();
    else socket.connect();

    // CA-06: al salir de la página o antes de reintentar, se suelta la conexión
    return () => {
      socket.off('connect', onConnect);
      socket.off('chat:unauthorized', onUnauthorized);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      releaseChatSocket();
    };
  }, [attempt]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid h-[75dvh] min-h-[320px] grid-rows-[minmax(0,1fr)] gap-4 md:grid-cols-[340px_1fr]">
        {/* Columna izquierda: lista de conversaciones (HU-06) */}
        <aside
          className={`${
            selected ? 'hidden md:flex' : 'flex'
          } min-h-0 min-w-0 flex-col rounded-2xl border border-slate-200 bg-white/60 overflow-hidden`}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200">
            <h1 className="text-lg font-bold text-slate-900">Mensajes</h1>
            <StatusBadge status={status} />
          </div>

          <div className="border-b border-slate-200 p-3">
            <button
              type="button"
              onClick={() => void handleStartChat()}
              disabled={contactsLoading || startingUserId !== null}
              className="min-h-11 w-full rounded-xl bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Nuevo chat
            </button>
          </div>

          {showContacts && (
            <section
              aria-label="Seleccionar contacto"
              className="border-b border-slate-200 bg-white p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  Selecciona una persona
                </h2>

                <button
                  type="button"
                  onClick={() => setShowContacts(false)}
                  disabled={startingUserId !== null}
                  className="rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cerrar
                </button>
              </div>

              {contactsLoading && (
                <p role="status" className="py-3 text-sm text-slate-500">
                  Cargando contactos...
                </p>
              )}

              {contactsError && (
                <p role="alert" className="mb-3 text-sm text-red-700">
                  {contactsError}
                </p>
              )}

              {!contactsLoading && !contactsError && contacts.length === 0 && (
                <p className="py-3 text-sm text-slate-500">
                  No hay contactos disponibles.
                </p>
              )}

              {!contactsLoading && (
                <ul className="max-h-72 space-y-1 overflow-y-auto">
                  {contacts.map((contact) => (
                    <li key={contact.usuario_id}>
                      <button
                        type="button"
                        onClick={() => void handleChooseContact(contact.usuario_id)}
                        disabled={startingUserId !== null}
                        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left hover:bg-slate-100 disabled:opacity-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {contact.nombre || 'Usuario'}
                          </span>
                          <span className="block text-xs capitalize text-slate-500">
                            {contact.rol || 'Sin rol'}
                          </span>
                        </span>

                        {startingUserId === contact.usuario_id && (
                          <Loader2
                            className="h-4 w-4 shrink-0 animate-spin"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <ConversationList
            conversations={conversations}
            loading={loading}
            error={listError}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRetry={retryList}
            onStartChat={handleStartChat}
          />
        </aside>

        {/* Columna derecha: conversación abierta o aviso */}
        <section
          className={`${
            selected ? 'flex' : 'hidden md:flex'
          } min-h-0 min-w-0 flex-col rounded-2xl border border-slate-200 bg-white/60 overflow-hidden`}
        >
          {/* CA-02 de HU-01: sesión no válida */}
          {status === 'unauthorized' && (
            <div className="flex flex-col items-center gap-3 p-4 border-b border-slate-200 text-center">
              <p className="text-sm text-slate-500">
                Tu sesión expiró o no es válida. Inicia sesión nuevamente.
              </p>
              <Link
                href="/login"
                className="flex items-center space-x-2 px-4 py-2 bg-[#0F172A] text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <span>Ir a inicio de sesión</span>
              </Link>
            </div>
          )}

          {/* CA-05 de HU-01: botón de reintentar si no se pudo conectar */}
          {status === 'disconnected' && (
            <div className="flex flex-col items-center gap-2 p-4 border-b border-slate-200">
              <button
                type="button"
                onClick={retry}
                disabled={isRetrying}
                aria-label="Reintentar conexión con el servidor de chat"
                className="flex items-center space-x-2 px-4 py-2 bg-[#0F172A] text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{isRetrying ? 'Reintentando...' : 'Reintentar'}</span>
              </button>
              {attempt > 0 && <p className="text-xs text-slate-400">Intento #{attempt}</p>}
            </div>
          )}

          {selected ? (
            <ConversationPanel
              key={selected.id}
              conversation={selected}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageSquare className="w-8 h-8 text-slate-400" />
              <p className="text-sm font-semibold text-slate-900">Selecciona una conversación</p>
              <p className="text-xs text-slate-500">para empezar a chatear.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// useSearchParams exige un Suspense en Next.js
export default function MensajesPage() {
  return (
    <Suspense fallback={null}>
      <MensajesPageContent />
    </Suspense>
  );
}