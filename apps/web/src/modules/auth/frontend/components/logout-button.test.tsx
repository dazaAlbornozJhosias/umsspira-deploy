/// <reference types="jest" />
import { fireEvent, render, screen } from "@testing-library/react";
import { authStore } from "../store";
import { saveSession } from "../services";
import { LogoutButton } from "./logout-button";

const mockHardRedirect = jest.fn();

// El botón ya no usa el router: hace una navegación completa para limpiar la caché de Next
jest.mock("../services/navigation", () => ({
  hardRedirect: (path: string) => mockHardRedirect(path),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    mockHardRedirect.mockClear();
    saveSession("token-abc", "titulado", false);
    authStore.setState({ status: "authenticated", role: "titulado", accessToken: "token-abc" });
  });

  it("descarta la sesión y vuelve al login (CA-05.6)", () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(document.cookie).not.toContain("umsspira_token");
    expect(authStore.getState().status).toBe("idle");
    expect(mockHardRedirect).toHaveBeenCalledWith("/login");
  });
});