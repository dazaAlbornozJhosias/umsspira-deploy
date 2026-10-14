import { useSyncExternalStore } from "react";
import type { UserRole } from "../services";

export type AuthStatus = "idle" | "loading" | "error" | "authenticated";

export interface AuthState {
  status: AuthStatus;
  role: UserRole | null;
  accessToken: string | null;
  error: string | null;
}

const initialState: AuthState = { status: "idle", role: null, accessToken: null, error: null };

let state: AuthState = initialState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getState: () => state,
  setState(partial: Partial<AuthState>) {
    state = { ...state, ...partial };
    emit();
  },
  reset() {
    state = initialState;
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useAuthStore(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState);
}