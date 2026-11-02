import { act, fireEvent, render, screen } from "@testing-library/react";
import { SessionExpiredDialog } from "./session-expired-dialog";
import { authStore } from "../store";
import { clearSession } from "../services/session";
import { hardRedirect } from "../services/navigation";
import { notifySessionExpired } from "../services/session-expired";

jest.mock("../store", () => ({ authStore: { reset: jest.fn() } }));
jest.mock("../services/session", () => ({ clearSession: jest.fn() }));
jest.mock("../services/navigation", () => ({ hardRedirect: jest.fn() }));

describe("HU-004 CA-06: ventana de alerta de sesión caducada", () => {
  beforeEach(() => jest.clearAllMocks());

  it("no se muestra mientras la sesión es válida", () => {
    render(<SessionExpiredDialog />);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("al recibir un 401 muestra la alerta y limpia el estado local de autenticación", () => {
    render(<SessionExpiredDialog />);
    act(() => notifySessionExpired());

    const dialog = screen.getByRole("alertdialog", { name: "Su sesión ha expirado" });
    expect(dialog).toHaveTextContent("Por seguridad, inicie sesión nuevamente para continuar.");
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(authStore.reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Iniciar sesión nuevamente" })).toHaveFocus();
  });

  it("redirige a /login solicitando reautenticación", () => {
    render(<SessionExpiredDialog />);
    act(() => notifySessionExpired());
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión nuevamente" }));
    expect(hardRedirect).toHaveBeenCalledWith("/login?reportes=sesion-expirada");
  });
});
