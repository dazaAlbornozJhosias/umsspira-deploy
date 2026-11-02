'use client';

import { render, screen } from "@testing-library/react";
import { PortalSiteHeader } from "./portal-site-header";
import { resetConnectedNavbarCache } from "./navbar/connected-navbar";

const mockUsePathname = jest.fn((): string | null => null);

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("PortalSiteHeader", () => {
  beforeEach(() => {
    resetConnectedNavbarCache();
    mockUsePathname.mockReturnValue(null);
    sessionStorage.clear();
    localStorage.clear();
  });

  it.each([null, "/portal", "/portal/mensajes", "/portal/comunidad"])(
    "usa la misma barra oficial en %s",
    async (pathname) => {
      mockUsePathname.mockReturnValue(pathname);
      render(<PortalSiteHeader />);
      expect(await screen.findByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    },
  );

  it.each(["/portal/institucional", "/portal/institucional/"])(
    "renderiza un único encabezado oficial en %s",
    async (pathname) => {
      mockUsePathname.mockReturnValue(pathname);
      render(<PortalSiteHeader />);
      expect(await screen.findByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    },
  );
});