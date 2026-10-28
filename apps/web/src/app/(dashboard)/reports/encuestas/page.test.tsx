import { render, screen } from "@testing-library/react";
import EmploymentSurveyAdminPage from "./page";

describe("HU-004/T4.1: destino administrativo de encuestas", () => {
  it("muestra las secciones del mockup sin afirmar que existen métricas", () => {
    render(<EmploymentSurveyAdminPage />);
    expect(screen.getByRole("heading", { name: "Encuestas de Empleabilidad" }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reportes de encuestas" }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seguimiento institucional" }))
      .toBeInTheDocument();
    expect(screen.getAllByText("Pendiente de integración")).toHaveLength(2);
  });
});
