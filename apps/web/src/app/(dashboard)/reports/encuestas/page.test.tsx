import { render, screen } from "@testing-library/react";
import EmploymentSurveyAdminPage from "./page";

// El reporte consulta la API; aquí solo se verifica la estructura de la página.
jest.mock("@/modules/surveys/frontend/components/survey-report-dashboard", () => ({
  SurveyReportDashboard: () => <p>Reporte de encuestas</p>,
}));

describe("HU-004/T4.1: destino administrativo de encuestas", () => {
  it("muestra las secciones del mockup con el reporte de encuestas", () => {
    render(<EmploymentSurveyAdminPage />);
    expect(screen.getByRole("heading", { name: "Encuestas de Empleabilidad" }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reportes de encuestas" }))
      .toBeInTheDocument();
    expect(screen.getByText("Seguimiento institucional")).toBeInTheDocument();
    expect(screen.getByText("Reporte de encuestas")).toBeInTheDocument();
  });

  it("HU-004 CA-10: el contenedor del reporte puede encogerse en móvil", () => {
    render(<EmploymentSurveyAdminPage />);
    const reportSection = screen.getByRole("heading", { name: "Reportes de encuestas" }).closest("section");
    expect(reportSection).toHaveClass("min-w-0");
  });
});
