import { fireEvent, render, screen } from "@testing-library/react";
import { RequestCorrectionLinkForm } from "./request-correction-link-form";
import * as applicationService from "../services/application.service";

jest.mock("../services/application.service", () => ({
  ...jest.requireActual("../services/application.service"),
  requestCorrectionLink: jest.fn(),
}));

describe("RequestCorrectionLinkForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza los campos de identidad y el botón de envío", () => {
    render(<RequestCorrectionLinkForm />);
    expect(screen.getByLabelText(/C\.I\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Complemento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expedido en/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Solicitar enlace/i })).toBeInTheDocument();
  });

  it("valida campos requeridos antes de enviar", async () => {
    render(<RequestCorrectionLinkForm />);
    fireEvent.click(screen.getByRole("button", { name: /Solicitar enlace/i }));

    const errorMessages = await screen.findAllByText(/Este campo es obligatorio/i);
    expect(errorMessages.length).toBeGreaterThanOrEqual(2);
    expect(applicationService.requestCorrectionLink).not.toHaveBeenCalled();
  });

  it("muestra mensaje genérico de éxito tras enviar solicitud válida", async () => {
    (applicationService.requestCorrectionLink as jest.Mock).mockResolvedValue({
      status: "success",
      message:
        "Si los datos corresponden a una solicitud observada, se enviará un enlace de corrección al correo registrado",
    });

    render(<RequestCorrectionLinkForm />);
    fireEvent.change(screen.getByLabelText(/C\.I\./i), { target: { value: "9000013" } });
    fireEvent.change(screen.getByLabelText(/Expedido en/i), { target: { value: "CB" } });
    fireEvent.click(screen.getByRole("button", { name: /Solicitar enlace/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Si los datos corresponden a una solicitud observada, se enviará un enlace de corrección al correo registrado",
    );
    expect(applicationService.requestCorrectionLink).toHaveBeenCalledWith({
      ci: "9000013",
      complemento: undefined,
      expedidoEn: "CB",
    });
  });

  it("muestra mensaje de límite de tráfico si la API responde con 429", async () => {
    (applicationService.requestCorrectionLink as jest.Mock).mockResolvedValue({
      status: "rate-limited",
      message: "Demasiadas solicitudes; intenta más tarde",
    });

    render(<RequestCorrectionLinkForm />);
    fireEvent.change(screen.getByLabelText(/C\.I\./i), { target: { value: "9000013" } });
    fireEvent.change(screen.getByLabelText(/Expedido en/i), { target: { value: "CB" } });
    fireEvent.click(screen.getByRole("button", { name: /Solicitar enlace/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Demasiadas solicitudes; intenta más tarde",
    );
  });
});
