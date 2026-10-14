import { render, screen } from "@testing-library/react";

import { AgeBadge, StatusBadge, type RequestStatus } from "./badge";

describe("StatusBadge", () => {
  const cases: Array<[RequestStatus, string]> = [
    ["pending", "Pendiente"],
    ["observed", "Observado"],
    ["approved", "Aprobado"],
    ["rejected", "Rechazado"],
  ];

  it.each(cases)("muestra la etiqueta de %s", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
});

describe("AgeBadge", () => {
  const now = new Date("2026-10-05T12:00:00Z");

  it("muestra las horas transcurridas cuando no supera el plazo", () => {
    render(<AgeBadge submittedAt="2026-10-05T00:00:00Z" now={now} />);
    expect(screen.getByText("12 h")).toBeTruthy();
  });

  it("marca la alerta cuando supera las 48 horas", () => {
    render(<AgeBadge submittedAt="2026-10-02T12:00:00Z" now={now} />);
    expect(screen.getByText("Más de 48 h")).toBeTruthy();
  });

  it("muestra menos de 1 h para solicitudes recién enviadas", () => {
    render(<AgeBadge submittedAt="2026-10-05T11:30:00Z" now={now} />);
    expect(screen.getByText("Menos de 1 h")).toBeTruthy();
  });

  it("muestra un texto neutro cuando la fecha es inválida", () => {
    render(<AgeBadge submittedAt="no-es-una-fecha" now={now} />);
    expect(screen.getByText("Fecha no disponible")).toBeTruthy();
  });
});