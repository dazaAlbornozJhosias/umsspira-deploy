import { render, screen } from "@testing-library/react";

import { AdminNavbar } from "./admin-navbar";

describe("AdminNavbar", () => {
  it("mantiene Solicitudes y Mi perfil, y agrega el acceso al perfil profesional (Épica 2)", () => {
    render(<AdminNavbar />);

    expect(screen.getByRole("link", { name: "Solicitudes" })).toHaveAttribute("href", "/applications");
    expect(screen.getByRole("link", { name: "Mi perfil" })).toHaveAttribute("href", "/me");
    expect(screen.getByRole("link", { name: "Mi perfil profesional" })).toHaveAttribute("href", "/profile");
  });
});
