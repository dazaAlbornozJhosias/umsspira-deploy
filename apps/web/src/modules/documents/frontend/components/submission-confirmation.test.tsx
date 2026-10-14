import { render, screen } from "@testing-library/react";

import { SubmissionConfirmation } from "./submission-confirmation";

const props = {
  submittedAt: "2026-10-01T15:30:00Z",
  documentType: "national-title" as const,
  fullName: "Juan Pérez Rojas",
  idNumber: "1234567",
  email: "juanperez@gmail.com",
};

describe("SubmissionConfirmation", () => {
  it("muestra el mensaje de solicitud enviada", () => {
    render(<SubmissionConfirmation {...props} />);
    expect(screen.getByText("Solicitud enviada")).toBeTruthy();
  });

  it("muestra los datos de la solicitud", () => {
    render(<SubmissionConfirmation {...props} />);
    expect(screen.getByText("Título en Provisión Nacional")).toBeTruthy();
    expect(screen.getByText("Juan Pérez Rojas")).toBeTruthy();
    expect(screen.getByText("1234567")).toBeTruthy();
  });

  it("muestra el correo enmascarado y no el completo", () => {
    render(<SubmissionConfirmation {...props} />);
    expect(screen.getByText("ju****z@gmail.com")).toBeTruthy();
    expect(screen.queryByText("juanperez@gmail.com")).toBeNull();
  });

  it("informa el plazo de respuesta de 48 horas", () => {
    render(<SubmissionConfirmation {...props} />);
    expect(screen.getByText(/48 horas/)).toBeTruthy();
  });

  it("no falla y avisa cuando la fecha de envío es inválida", () => {
    render(<SubmissionConfirmation {...props} submittedAt="no-es-una-fecha" />);
    expect(screen.getByText("Fecha no disponible")).toBeTruthy();
  });
});