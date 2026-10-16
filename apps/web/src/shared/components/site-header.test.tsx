import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { PortalSiteHeader } from "./portal-site-header";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

describe("PortalSiteHeader", () => {
  beforeEach(() => {
    jest.mocked(usePathname).mockReturnValue(null);
    sessionStorage.clear();
    localStorage.clear();
  });

  it("mantiene el encabezado anterior si la ruta aún no está disponible", () => {
    render(<PortalSiteHeader />);
    const logo = screen.getByRole("link", { name: /umsspira/i });
    expect(logo).toHaveAttribute("href", "/portal");
  });

  it("mantiene el encabezado anterior en las demás páginas del portal", () => {
    jest.mocked(usePathname).mockReturnValue("/portal/comunidad");
    render(<PortalSiteHeader />);
    expect(screen.getByRole("link", { name: /umsspira/i })).toHaveAttribute("href", "/portal");
    expect(screen.queryByRole("link", { name: "Iniciar sesión" })).not.toBeInTheDocument();
  });

  it.each(["/portal/institucional", "/portal/institucional/"])(
    "muestra una sola navbar oficial para visitantes en %s",
    (pathname) => {
      jest.mocked(usePathname).mockReturnValue(pathname);
      render(<PortalSiteHeader />);
      expect(screen.getAllByRole("banner")).toHaveLength(1);
      expect(screen.getByRole("link", { name: /umsspira/i })).toHaveAttribute("href", "/portal/institucional");
      expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
    },
  );
});
