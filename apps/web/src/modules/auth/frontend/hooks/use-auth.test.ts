/// <reference types="jest" />

import { act, renderHook } from "@testing-library/react";
import { authStore } from "../store";
import { LOGIN_ERROR_MESSAGE } from "../services";
import { getAccessToken } from "@/shared/services/auth-session";
import { useAuth } from "./use-auth";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("useAuth", () => {
  beforeEach(() => {
    mockPush.mockClear();
    authStore.reset();
    // Emula el endpoint real POST /api/auth/login (USE_MOCK = false).
    global.fetch = jest.fn(async (_url: unknown, options?: { body?: unknown }) => {
      const body = JSON.parse(String((options?.body ?? "{}") as string));
      if (body.email === "admin@umss.edu.bo" && body.password === "admin1234") {
        return { ok: true, json: async () => ({ data: { accessToken: "token-admin", role: "administrador" } }) };
      }
      if (body.email === "titulado@umss.edu.bo" && body.password === "titulado1234") {
        return { ok: true, json: async () => ({ data: { accessToken: "token-titulado", role: "titulado" } }) };
      }
      return { ok: false, status: 401, json: async () => ({ message: "Correo electrónico o contraseña incorrectos" }) };
    }) as jest.Mock;
  });

  it("HU-004: inicia sesión como administrador y redirige a /reports", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn({ email: "admin@umss.edu.bo", password: "admin1234" });
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.role).toBe("administrador");
    expect(result.current.accessToken).toBeTruthy();
    expect(mockPush).toHaveBeenCalledWith("/reports");
  });

  it("inicia sesión como titulado y redirige al portal", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn({ email: "titulado@umss.edu.bo", password: "titulado1234" });
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.role).toBe("titulado");
    expect(mockPush).toHaveBeenCalledWith("/portal");
  });

  it("publica el token en el almacén que usan las pantallas de mentoría", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn({ email: "titulado@umss.edu.bo", password: "titulado1234" });
    });

    expect(getAccessToken()).toBe("token-titulado");
  });

  it("guarda el mensaje genérico cuando las credenciales son incorrectas", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn({ email: "nadie@umss.edu.bo", password: "incorrecta" });
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(LOGIN_ERROR_MESSAGE);
    expect(result.current.accessToken).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });
});