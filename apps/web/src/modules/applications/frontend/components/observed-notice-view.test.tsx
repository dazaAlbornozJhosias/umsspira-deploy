import { fireEvent, render, screen } from "@testing-library/react";
import { ObservedNoticeView } from "./observed-notice-view";
import * as applicationService from "../services/application.service";

jest.mock("../services/application.service", () => ({
  ...jest.requireActual("../services/application.service"),
  getObservedApplication: jest.fn(),
}));

const mockDetail = {
  id: "app-123",
  version: 2,
  nombres: "Juan Carlos",
  apellidos: "Pérez Mamani",
  ci: "6842109",
  complementoCi: "",
  expedidoEn: "CB",
  codigoSis: "201804921",
  correo: "carlos.perez.m@correo.com",
  telefono: "70745821",
  carreraId: "carrera-uuid-1",
  anioEgreso: 2023,
  deseaMentor: false,
  fechaTitulacion: null,
  fechaIngreso: "1998-05-14",
  observacion: {
    categoria: "Datos personales y contacto",
    justificacion: "El documento adjunto no es completamente legible.",
    fecha: "2026-10-22T11:30:00.000Z",
  },
  documento: {
    id: "doc-1",
    nombre: "Certificado_Conclusion_Estudios_JuanPerez.pdf",
    tipoDocumento: "Título en Provisión Nacional",
    mime: "application/pdf",
    sizeBytes: 4.2 * 1024 * 1024,
  },
};

describe("ObservedNoticeView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el estado de carga inicialmente", () => {
    (applicationService.getObservedApplication as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<ObservedNoticeView token="abc123" />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando tu solicitud");
  });

  it("muestra categoría, justificación, datos precargados y documento con un enlace válido", async () => {
    (applicationService.getObservedApplication as jest.Mock).mockResolvedValue({
      status: "success",
      data: mockDetail,
    });
    render(<ObservedNoticeView token="abc123" />);

    expect(await screen.findByText("Corrige tu solicitud")).toBeInTheDocument();
    expect(screen.getByText("Categoría: Datos personales y contacto")).toBeInTheDocument();
    expect(screen.getByText(/no es completamente legible/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombres/)).toHaveValue("Juan Carlos");
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue("carlos.perez.m@correo.com");
    expect(
      screen.getByText("Certificado_Conclusion_Estudios_JuanPerez.pdf"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Revisar cambios/ })).toBeDisabled();
  });

  it("pasa al resumen de entrega y conserva lo escrito al volver a editar", async () => {
    (applicationService.getObservedApplication as jest.Mock).mockResolvedValue({
      status: "success",
      data: mockDetail,
    });
    render(<ObservedNoticeView token="abc123" />);
    await screen.findByText("Corrige tu solicitud");

    fireEvent.change(screen.getByLabelText(/Apellidos/), { target: { value: "Quispe" } });
    fireEvent.click(screen.getByRole("button", { name: /Revisar cambios/ }));

    expect(await screen.findByText("Revisión de solicitud")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entregar solicitud/ })).toBeEnabled();
    expect(screen.getAllByText("Modificado")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Volver a editar/ }));
    expect(screen.queryByText("Revisión de solicitud")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Apellidos/)).toHaveValue("Quispe");
  });

  it("muestra mensaje claro con un enlace inválido y no permite editar", async () => {
    (applicationService.getObservedApplication as jest.Mock).mockResolvedValue({
      status: "invalid-link",
    });
    render(<ObservedNoticeView token="invalido" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Enlace no válido o vencido");
    expect(screen.queryByText("Corrige tu solicitud")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nombres/)).not.toBeInTheDocument();
  });

  it("muestra mensaje de error de conexión con botón para reintentar", async () => {
    (applicationService.getObservedApplication as jest.Mock).mockResolvedValue({
      status: "error",
      message: "Fallo de red simulado",
    });
    render(<ObservedNoticeView token="error-token" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Error de conexión");
    expect(screen.getByText("Fallo de red simulado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reintentar/ })).toBeInTheDocument();
  });
});
