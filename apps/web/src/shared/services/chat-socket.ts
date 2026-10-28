// apps/web/src/shared/services/chat-socket.ts
import { io, Socket } from 'socket.io-client';

const CHAT_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// Una conexión por pestaña (HU-01 CA-07): cada pestaña tiene su propio módulo JS,
// por lo que cerrar una no afecta a la otra.
let socket: Socket | null = null;

export const getChatSocket = (): Socket => {
  if (!socket) {
    socket = io(`${CHAT_URL}/chat`, {
      withCredentials: true, // el navegador envía la cookie de sesión
      autoConnect: false, // la conexión la abre quien use el socket
      // Reintentos automáticos (HU-02 CA-02): 2s -> 4s -> 8s, sin aleatoriedad.
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0,
    });
  }
  return socket;
};

// HU-10: la barra superior y la página de chat comparten el mismo socket.
// Cada uno lo "retiene" al montarse y lo "suelta" al desmontarse; la conexión
// solo se cierra cuando ya nadie la usa (con una pequeña espera para no
// cerrar y reabrir al cambiar de pantalla).
let holders = 0;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
const CLOSE_GRACE_MS = 300;

export const retainChatSocket = (): Socket => {
  holders += 1;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  return getChatSocket();
};

export const releaseChatSocket = (): void => {
  holders = Math.max(0, holders - 1);
  if (holders > 0 || closeTimer) return;
  closeTimer = setTimeout(() => {
    closeTimer = null;
    if (holders === 0) disconnectChatSocket();
  }, CLOSE_GRACE_MS);
};

// Cierre forzado (por ejemplo, al cerrar sesión).
export const disconnectChatSocket = (): void => {
  holders = 0;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Reinicia el ciclo de intentos manualmente.
export const retryConnection = (): void => {
  if (!socket) return;
  socket.disconnect();
  socket.connect();
};