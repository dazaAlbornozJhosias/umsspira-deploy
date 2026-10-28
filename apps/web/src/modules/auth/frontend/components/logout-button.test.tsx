/// <reference types="jest" />
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { revokeCurrentSession } from '@/shared/services/auth-session';
import { authStore } from "../store";
import { saveSession } from "../services";
import { LogoutButton } from "./logout-button";

const mockHardRedirect = jest.fn();
jest.mock('@/shared/services/auth-session', () => ({
  ...jest.requireActual('@/shared/services/auth-session'),
  revokeCurrentSession: jest.fn(),
}));

// El botón ya no usa el router: hace una navegación completa para limpiar la caché de Next
jest.mock("../services/navigation", () => ({
  hardRedirect: (path: string) => mockHardRedirect(path),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    mockHardRedirect.mockClear();
    jest.mocked(revokeCurrentSession).mockResolvedValue(undefined);
    saveSession("token-abc", "titulado", false);
    authStore.setState({ status: "authenticated", role: "titulado", accessToken: "token-abc" });
  });

  it("revoca la sesión antes de volver al login (CA-05.6)", async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(revokeCurrentSession).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(authStore.getState().status).toBe("idle"));
    expect(document.cookie).not.toContain("umsspira_token");
    expect(mockHardRedirect).toHaveBeenCalledWith("/login");
  });

  it('conserva la sesión y muestra el error existente cuando falla la revocación', async () => {
    jest.mocked(revokeCurrentSession).mockRejectedValueOnce(new Error('Sin conexión'));
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cerrar la sesión');
    expect(authStore.getState().status).toBe('authenticated');
    expect(mockHardRedirect).not.toHaveBeenCalled();
  });
});
