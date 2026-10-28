/// <reference types="jest" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authStore } from "../store";
import { LoginForm } from "./login-form";

const mockPush = jest.fn();
const mockSaveSession = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Solo registra con qué valor se guarda la sesión; la lógica real se sigue ejecutando
jest.mock("../services/session", () => {
  const actual = jest.requireActual<typeof import("../services/session")>("../services/session");
  return {
    ...actual,
    saveSession: (token: string, role: string, remember: boolean) => {
      mockSaveSession(token, role, remember);
      actual.saveSession(token, role, remember);
    },
  };
});

// Las etiquetas llevan un asterisco de campo obligatorio, por eso se busca por el inicio del texto.
// "^contraseña" no coincide con el botón "Mostrar contraseña".
function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/^correo electrónico/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^contraseña/i), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /^ingresar/i }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSaveSession.mockClear();
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

  it("muestra los mensajes de validación cuando los campos están vacíos", () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: /^ingresar/i }));

    expect(screen.getByText("Ingresa tu correo electrónico")).toBeTruthy();
    expect(screen.getByText("Ingresa tu contraseña")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("rechaza un correo con formato inválido", () => {
    render(<LoginForm />);

    fillAndSubmit("abc", "admin1234");

    expect(screen.getByText("Ingresa un correo electrónico válido")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("muestra un mensaje genérico con credenciales incorrectas (CA-05.4)", async () => {
    render(<LoginForm />);

    fillAndSubmit("nadie@umss.edu.bo", "contraseña-equivocada");

    expect(await screen.findByText("Correo electrónico o contraseña incorrectos")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("HU-004: redirige al administrador a reportes institucionales", async () => {
    render(<LoginForm />);

    fillAndSubmit("admin@umss.edu.bo", "admin1234");

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/reports"));
  });

  it("redirige al titulado al portal (decisión de coordinación; CA-05.3 pendiente del PO)", async () => {
    render(<LoginForm />);

    fillAndSubmit("titulado@umss.edu.bo", "titulado1234");

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/portal"));
  });

  it("muestra la casilla de recordar sesión desmarcada por defecto (BUG4)", () => {
    render(<LoginForm />);

    const checkbox = screen.getByLabelText(/recordar mi sesión en este equipo/i) as HTMLInputElement;

    expect(checkbox.type).toBe("checkbox");
    expect(checkbox.checked).toBe(false);
  });

  it("permite marcar y desmarcar la casilla (BUG4)", () => {
    render(<LoginForm />);
    const checkbox = screen.getByLabelText(/recordar mi sesión en este equipo/i) as HTMLInputElement;

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it("guarda la sesión como persistente solo si se marca la casilla (BUG1)", async () => {
    const { unmount } = render(<LoginForm />);
    fillAndSubmit("titulado@umss.edu.bo", "titulado1234");
    await waitFor(() =>
      expect(mockSaveSession).toHaveBeenCalledWith("token-titulado", "titulado", false),
    );
    unmount();

    mockSaveSession.mockClear();
    authStore.reset();
    render(<LoginForm />);
    fireEvent.click(screen.getByLabelText(/recordar mi sesión en este equipo/i));
    fillAndSubmit("titulado@umss.edu.bo", "titulado1234");
    await waitFor(() =>
      expect(mockSaveSession).toHaveBeenCalledWith("token-titulado", "titulado", true),
    );
  });
});

describe("HU-004: mensaje de acceso a reportes", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("explica por qué se redirigió a un visitante a iniciar sesión", async () => {
    window.history.pushState({}, "", "/login?reportes=requiere-sesion");
    render(<LoginForm />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Debe iniciar sesión para acceder a este módulo",
    );
  });
});
