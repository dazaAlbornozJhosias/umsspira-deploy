"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { authStore, useAuthStore } from "../store";
import { clearAccessToken, setAccessToken } from "@/shared/services/auth-session";
import {
  getRedirectPath,
  login,
  LOGIN_ERROR_MESSAGE,
  saveSession,
  type LoginCredentials,
} from "../services";

export function useAuth() {
  const router = useRouter();
  const state = useAuthStore();

  const signIn = useCallback(
    async (credentials: LoginCredentials, remember = false) => {
      authStore.setState({ status: "loading", error: null });
      try {
        const { role, accessToken } = await login(credentials);
        authStore.setState({ status: "authenticated", role, accessToken });
        saveSession(accessToken, role, remember);
        setAccessToken(accessToken);
        router.push(getRedirectPath(role));
      } catch {
        // CA-05.4: siempre el mismo mensaje, sin decir qué dato falló
        authStore.setState({
          status: "error",
          role: null,
          accessToken: null,
          error: LOGIN_ERROR_MESSAGE,
        });
      }
    },
    [router],
  );

  return { ...state, isLoading: state.status === "loading", signIn };
}