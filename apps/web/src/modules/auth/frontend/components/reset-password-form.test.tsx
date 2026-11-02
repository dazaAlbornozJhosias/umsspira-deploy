import { fireEvent, render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "./reset-password-form";
import {
  RecoveryLinkError,
  resetPassword,
  validateRecoveryLink,
} from "../services/password-recovery.service";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

jest.mock("../services/password-recovery.service", () => ({
  ...jest.requireActual("../services/password-recovery.service"),
  validateRecoveryLink: jest.fn(),
  resetPassword: jest.fn(),
}));

const mockedSearchParams = useSearchParams as jest.Mock;
const mockedValidate = validateRecoveryLink as jest.MockedFunction<typeof validateRecoveryLink>;
const mockedReset = resetPassword as jest.MockedFunction<typeof resetPassword>;

const VALID_PASSWORD = "Clave#2026";

function renderWithToken(token = "tok-123") {
  window.history.pushState({}, "", token ? `/reset-password?token=${token}` : "/reset-password");
  mockedSearchParams.mockReturnValue(new URLSearchParams(token ? `token=${token}` : ""));
  return render(<ResetPasswordForm />);
}

function fillPasswords(password: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/^confirmar contraseña/i), {
    target: { value: confirmation },
  });
}

function submitButton() {
  return screen.getByRole("button", { name: "Cambiar contraseña" }) as HTMLButtonElement;
}

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    mockedValidate.mockReset();
    mockedReset.mockReset();
    mockedValidate.mockResolvedValue(undefined);
    mockedReset.mockResolvedValue(undefined);
  });

  it("muestra enlace no válido y no consulta la API si no hay token", async () => {
    renderWithToken("");
    expect(await screen.findByText(/el enlace no es válido/i)).toBeTruthy();
    expect(mockedValidate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "Solicitar otro enlace" }).getAttribute("href"),
    ).toBe("/forgot-password");
  });

  it("valida el enlace al abrir y quita el token de la URL", async () => {
    renderWithToken("tok-123");
    expect(await screen.findByLabelText(/^nueva contraseña/i)).toBeTruthy();
    expect(mockedValidate).toHaveBeenCalledWith("tok-123");
    expect(window.location.search).toBe("");
  });

  it("muestra el error de enlace vencido con la opción de pedir otro", async () => {
    mockedValidate.mockRejectedValue(new RecoveryLinkError("expired", "vencido"));
    renderWithToken();
    expect(await screen.findByText(/el enlace venció/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Solicitar otro enlace" }).getAttribute("href"),
    ).toBe("/forgot-password");
  });

  it("muestra el error de enlace ya usado", async () => {
    mockedValidate.mockRejectedValue(new RecoveryLinkError("used", "usado"));
    renderWithToken();
    expect(await screen.findByText(/este enlace ya se usó/i)).toBeTruthy();
  });

  it("muestra un aviso distinto si no se pudo comprobar el enlace", async () => {
    mockedValidate.mockRejectedValue(new Error("red caida"));
    renderWithToken();
    expect(await screen.findByText(/no fue posible comprobar el enlace/i)).toBeTruthy();
  });

  it("mantiene el botón desactivado si la contraseña no cumple la política", async () => {
    renderWithToken();
    await screen.findByLabelText(/^nueva contraseña/i);
    fillPasswords("clave", "clave");
    expect(submitButton().disabled).toBe(true);
    expect(mockedReset).not.toHaveBeenCalled();
  });

  it("mantiene el botón desactivado si las contraseñas no coinciden", async () => {
    renderWithToken();
    await screen.findByLabelText(/^nueva contraseña/i);
    fillPasswords(VALID_PASSWORD, "Otra#2026");
    expect(submitButton().disabled).toBe(true);
  });

  it("cambia la contraseña y ofrece ir al login", async () => {
    renderWithToken("tok-123");
    await screen.findByLabelText(/^nueva contraseña/i);
    fillPasswords(VALID_PASSWORD, VALID_PASSWORD);
    fireEvent.click(submitButton());

    expect(await screen.findByText(/tu contraseña fue cambiada/i)).toBeTruthy();
    expect(mockedReset).toHaveBeenCalledWith("tok-123", VALID_PASSWORD);
    expect(
      screen.getByRole("link", { name: "Ir a iniciar sesión" }).getAttribute("href"),
    ).toBe("/login");
  });

  it("muestra el error del enlace si se usó entre la validación y el cambio", async () => {
    mockedReset.mockRejectedValue(new RecoveryLinkError("used", "usado"));
    renderWithToken();
    await screen.findByLabelText(/^nueva contraseña/i);
    fillPasswords(VALID_PASSWORD, VALID_PASSWORD);
    fireEvent.click(submitButton());
    expect(await screen.findByText(/este enlace ya se usó/i)).toBeTruthy();
  });

  it("conserva el formulario y muestra un error genérico si el cambio falla", async () => {
    mockedReset.mockRejectedValue(new Error("fallo"));
    renderWithToken();
    await screen.findByLabelText(/^nueva contraseña/i);
    fillPasswords(VALID_PASSWORD, VALID_PASSWORD);
    fireEvent.click(submitButton());
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByLabelText(/^nueva contraseña/i)).toBeTruthy();
  });
});