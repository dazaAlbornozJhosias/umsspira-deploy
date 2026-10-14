import { render, screen } from "@testing-library/react";

import { TituladoHeader } from "./titulado-header";

jest.mock("./logout-button", () => ({
  LogoutButton: () => <button type="button">Cerrar sesión</button>,
}));

describe("TituladoHeader", () => {
  it("lleva al perfil profesional del titulado (Épica 2)", () => {
    render(<TituladoHeader />);

    expect(screen.getByRole("link", { name: "Mi perfil profesional" })).toHaveAttribute("href", "/profile");
  });

  it("sigue sin mostrar ningún enlace administrativo y conserva cerrar sesión", () => {
    render(<TituladoHeader />);

    expect(screen.queryByRole("link", { name: /solicitudes/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });
});
