import { render, screen } from "@testing-library/react";
import { PortalSiteHeader } from "./portal-site-header";

describe("PortalSiteHeader", () => {
  it("el logo enlaza a la pagina de inicio", () => {
    render(<PortalSiteHeader />);
    const logo = screen.getByRole("link", { name: /umsspira/i });
    expect(logo).toHaveAttribute("href", "/portal");
  });
});