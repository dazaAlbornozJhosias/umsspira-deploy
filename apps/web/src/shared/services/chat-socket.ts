import { io, type Socket } from "socket.io-client";
import { ensureAccessToken, refreshSession } from "./auth-session";
let socket: Socket | null = null;
let holders = 0;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let renewed = false;
export const getChatSocket = (): Socket => {
  if (!socket) {
    const origin = (
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    const instance = io(`${origin}/chat`, {
      autoConnect: false,
      auth: (callback) => {
        void ensureAccessToken()
          .then((token) => callback({ token }))
          .catch(() => callback({}));
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
    });
    instance.on("connect", () => {
      renewed = false;
    });
    instance.on(
      "connect_error",
      (error: Error & { data?: { code?: string } }) => {
        if (error.data?.code === "UNAUTHENTICATED" && !renewed && holders > 0) {
          renewed = true;
          void refreshSession()
            .then(() => {
              if (socket === instance && holders > 0) instance.connect();
            })
            .catch(() => undefined);
        }
      },
    );
    instance.on("chat:session_expired", () => {
      void refreshSession()
        .then(() => {
          if (socket === instance && holders > 0) instance.connect();
        })
        .catch(() => undefined);
    });
    socket = instance;
  }
  return socket;
};
export const retainChatSocket = (): Socket => {
  holders++;
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = null;
  const instance = getChatSocket();
  if (!instance.connected) instance.connect();
  return instance;
};
export const releaseChatSocket = (): void => {
  holders = Math.max(0, holders - 1);
  if (holders === 0 && !closeTimer)
    closeTimer = setTimeout(() => {
      closeTimer = null;
      if (holders === 0) disconnectChatSocket();
    }, 300);
};
export const disconnectChatSocket = (): void => {
  holders = 0;
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = null;
  const previous = socket;
  socket = null;
  previous?.removeAllListeners();
  previous?.io.removeAllListeners();
  previous?.disconnect();
};
export const retryConnection = (): void => {
  getChatSocket().connect();
};
if (typeof window !== "undefined")
  window.addEventListener("umsspira:session-cleared", disconnectChatSocket);
