import { render, screen } from "@testing-library/react";
import { AdminReportsNavigation } from "./admin-reports-navigation";

let mockPathname = "/reports";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("HU-004/T4.1: navegación de administrador", () => {
  afterEach(() => { mockPathname = "/reports"; });

  it("muestra ambos submódulos y activa reportería en /reports", () => {
    render(<AdminReportsNavigation />);
    expect(screen.getByRole("link", { name: "Reportes Institucionales" }))
      .toHaveAttribute("href", "/reports");
    expect(screen.getByRole("link", { name: "Encuestas de Empleabilidad" }))
      .toHaveAttribute("href", "/reports/encuestas");
    expect(screen.getByRole("link", { name: "Reportes Institucionales" }))
      .toHaveAttribute("aria-current", "page");
  });

  it("activa encuestas para la ruta administrativa, nunca /surveys", () => {
    mockPathname = "/reports/encuestas";
    render(<AdminReportsNavigation />);
    expect(screen.getByRole("link", { name: "Encuestas de Empleabilidad" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Reportes Institucionales" }))
      .not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("link", { name: "/surveys" })).not.toBeInTheDocument();
  });
});
