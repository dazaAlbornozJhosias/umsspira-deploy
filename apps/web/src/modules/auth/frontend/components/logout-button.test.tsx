/// <reference types="jest" />
import { fireEvent, render, screen } from "@testing-library/react";
import { authStore } from "../store";
import { saveSession } from "../services";
import { LogoutButton } from "./logout-button";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    mockPush.mockClear();
    authStore.reset();
  });

  it("descarta la sesión y vuelve al login (CA-05.6)", () => {
    saveSession("token", "administrador", false);
    authStore.setState({ status: "authenticated", role: "administrador", accessToken: "token" });
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(document.cookie).not.toContain("umsspira_token");
    expect(authStore.getState().status).toBe("idle");
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});