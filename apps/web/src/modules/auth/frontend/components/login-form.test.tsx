/// <reference types="jest" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authStore } from "../store";
import { LoginForm } from "./login-form";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

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

  it("redirige al administrador a la bandeja de solicitudes (CA-05.2)", async () => {
    render(<LoginForm />);

    fillAndSubmit("admin@umss.edu.bo", "admin1234");

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/applications"));
  });

  it("redirige al titulado a su área personal (CA-05.3)", async () => {
    render(<LoginForm />);

    fillAndSubmit("titulado@umss.edu.bo", "titulado1234");

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/me"));
  });
});