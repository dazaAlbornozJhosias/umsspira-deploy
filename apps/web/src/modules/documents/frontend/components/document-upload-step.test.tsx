import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  DocumentUploadStep,
  REGISTER_PATH,
  REVIEW_PATH,
  VERIFY_EMAIL_PATH,
} from "./document-upload-step";
import { useRegistrationStore } from "@/modules/registration/frontend/store";
import { uploadDocument } from "../services";

const mockPush = jest.fn();

jest.mock(
  "@/modules/registration/frontend/components/review-document-preview",
  () => ({
    ReviewDocumentPreview: () => <div>Documento guardado</div>,
  }),
);

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../services", () => ({
  ...jest.requireActual("../services"),
  uploadDocument: jest.fn(),
}));

const mockedUpload = uploadDocument as jest.Mock;
const INVALID_FILE =
  "Formato o tamaño no permitido. Adjunta un documento en PDF, PNG o JPG de máximo 5 MB";
const SESSION_TOKEN = "22222222-2222-4222-8222-222222222222";

const FILE_SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34], // %PDF-1.4
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46],
};

function buildFile(name: string, type: string, size = 2048) {
  const signature = FILE_SIGNATURES[type] ?? [0x00, 0x01, 0x02, 0x03];
  const bytes = new Uint8Array(signature);
  const file = new File([bytes], name, { type });
  Object.defineProperty(file, "size", { value: size });
  Object.defineProperty(file, "slice", {
    value: (start = 0, end = bytes.length) => ({
      arrayBuffer: () => Promise.resolve(bytes.slice(start, end).buffer),
    }),
  });
  return file;
}

async function chooseFile(file: File, testId = "document-input") {
  await act(async () => {
    fireEvent.change(screen.getByTestId(testId), { target: { files: [file] } });
  });
}

async function renderReadyStep() {
  render(<DocumentUploadStep />);
  await screen.findByLabelText(/^Tipo de documento/);
}

async function completeForm(
  file = buildFile("titulo.pdf", "application/pdf"),
  type = "titulo_provision_nacional",
) {
  fireEvent.change(screen.getByLabelText(/^Tipo de documento/), {
    target: { value: type },
  });
  await chooseFile(file);
  fireEvent.click(screen.getByLabelText(/Declaro bajo juramento/));
  return file;
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /Finalizar solicitud/ }));
}

describe("DocumentUploadStep", () => {
  let urlCounter = 0;

  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => `blob:preview-${++urlCounter}`);
    URL.revokeObjectURL = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useRegistrationStore.getState().reset();
    useRegistrationStore.getState().setSessionToken(SESSION_TOKEN);
  });

  it("pide completar los datos cuando no existe un registro en curso", async () => {
    useRegistrationStore.getState().reset();
    render(<DocumentUploadStep />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Completar mis datos" }),
    );
    expect(mockPush).toHaveBeenCalledWith(REGISTER_PATH);
  });

  it("habilita finalizar únicamente con tipo, archivo válido y declaración", async () => {
    await renderReadyStep();
    const button = screen.getByRole("button", { name: /Finalizar solicitud/ });
    expect(button).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "selecciona el tipo de documento",
    );
    fireEvent.change(screen.getByLabelText(/^Tipo de documento/), {
      target: { value: "diploma_academico" },
    });
    expect(button).toBeDisabled();
    await chooseFile(buildFile("titulo.pdf", "application/pdf"));
    expect(button).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "acepta la declaración jurada",
    );
    fireEvent.click(screen.getByLabelText(/Declaro bajo juramento/));
    expect(button).toBeEnabled();
    fireEvent.click(screen.getByLabelText(/Declaro bajo juramento/));
    expect(button).toBeDisabled();
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("permite cancelar incluso después de seleccionar un reemplazo sin modificar el documento guardado", async () => {
    const original = {
      path: "original-id",
      tipoDocumento: "diploma_academico" as const,
      mimeType: "application/pdf",
      sizeBytes: 2048,
      originalName: "original.pdf",
      previewUrl: null,
      previewKind: "pdf" as const,
    };
    useRegistrationStore.getState().setDocument(original);
    await renderReadyStep();
    await chooseFile(buildFile("reemplazo.png", "image/png"));
    fireEvent.change(screen.getByLabelText(/^Tipo de documento/), {
      target: { value: "certificado_egreso" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Cancelar y conservar/ }),
    );
    expect(mockPush).toHaveBeenCalledWith(REVIEW_PATH);
    expect(useRegistrationStore.getState().document).toEqual(original);
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("oculta la zona de carga al elegir un archivo y permite quitarlo", async () => {
    await renderReadyStep();

    expect(screen.getByTestId("document-drop-area")).toBeInTheDocument();

    await chooseFile(buildFile("diploma.png", "image/png"));

    expect(
      await screen.findByRole("img", {
        name: "Vista previa de diploma.png",
      }),
    ).toBeInTheDocument();

    expect(screen.queryByTestId("document-drop-area")).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Cambiar archivo/,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Quitar",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Quitar",
      }),
    );

    expect(screen.getByTestId("document-drop-area")).toBeInTheDocument();

    expect(screen.queryByText("diploma.png")).not.toBeInTheDocument();

    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it("acepta un archivo arrastrado a la zona de carga", async () => {
    await renderReadyStep();

    await act(async () => {
      fireEvent.drop(screen.getByTestId("document-drop-area"), {
        dataTransfer: { files: [buildFile("titulo.pdf", "application/pdf")] },
      });
    });

    expect(await screen.findByText("titulo.pdf")).toBeInTheDocument();
  });

  it("rechaza un archivo de más de 5 MB o con formato no permitido (CA-03.3)", async () => {
    await renderReadyStep();

    await chooseFile(
      buildFile("titulo.pdf", "application/pdf", 5 * 1024 * 1024 + 1),
    );
    expect(await screen.findByText(INVALID_FILE)).toBeInTheDocument();

    await chooseFile(
      buildFile(
        "titulo.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    );
    expect(await screen.findByText(INVALID_FILE)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Cambiar archivo/ }),
    ).not.toBeInTheDocument();
  });

  it("conserva el archivo anterior si el reemplazo no es válido y libera la vista previa al reemplazar", async () => {
    await renderReadyStep();
    await chooseFile(buildFile("diploma.png", "image/png"));

    await chooseFile(
      buildFile("virus.exe", "application/octet-stream"),
      "replace-document-input",
    );
    expect(await screen.findByText(INVALID_FILE)).toBeInTheDocument();
    expect(screen.getByText("diploma.png")).toBeInTheDocument();

    await chooseFile(
      buildFile("titulo.pdf", "application/pdf"),
      "replace-document-input",
    );
    expect(await screen.findByText("titulo.pdf")).toBeInTheDocument();
    expect(screen.queryByText(INVALID_FILE)).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("guarda el documento cargado y dirige al resumen de la solicitud (CA-07.1)", async () => {
    const file = buildFile("titulo.pdf", "application/pdf");
    mockedUpload.mockResolvedValue({
      ok: true,
      document: {
        path: "solicitudes/x/y.pdf",
        tipoDocumento: "titulo_provision_nacional",
        mimeType: "application/pdf",
        sizeBytes: 2048,
        originalName: "titulo.pdf",
      },
    });
    await renderReadyStep();
    await completeForm(file);

    submit();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(REVIEW_PATH));
    expect(mockedUpload).toHaveBeenCalledWith({
      sessionToken: SESSION_TOKEN,
      tipoDocumento: "titulo_provision_nacional",
      file,
    });
    expect(useRegistrationStore.getState().document).toEqual(
      expect.objectContaining({
        path: "solicitudes/x/y.pdf",
        tipoDocumento: "titulo_provision_nacional",
        originalName: "titulo.pdf",
        previewKind: "pdf",
      }),
    );
    expect(useRegistrationStore.getState().sessionToken).toBe(SESSION_TOKEN);
  });

  it("avisa el vencimiento cuando la sesión expiró al cargar el documento (CA-01.6)", async () => {
    const expired =
      "El tiempo para completar tu registro venció. Debes llenar el formulario desde el inicio.";
    mockedUpload.mockResolvedValue({
      ok: false,
      status: 410,
      message: expired,
      errors: [],
    });
    await renderReadyStep();
    await completeForm();

    submit();

    expect(await screen.findByText(expired)).toBeInTheDocument();
    expect(useRegistrationStore.getState().sessionToken).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Volver al formulario" }),
    );
    expect(mockPush).toHaveBeenCalledWith(REGISTER_PATH);
  });

  it("dirige a la verificación de correo si el servidor indica que no está verificado (CA-03.1)", async () => {
    mockedUpload.mockResolvedValue({
      ok: false,
      status: 403,
      code: "EMAIL_NOT_VERIFIED",
      message: "Debes verificar tu correo antes de adjuntar tu documento",
      errors: [],
    });
    await renderReadyStep();
    await completeForm();

    submit();

    expect(
      await screen.findByText(
        "Debes verificar tu correo antes de adjuntar tu documento",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Verificar mi correo" }),
    );
    expect(mockPush).toHaveBeenCalledWith(VERIFY_EMAIL_PATH);
  });

  it("muestra el rechazo del servidor en el campo archivo y conserva lo elegido", async () => {
    mockedUpload.mockResolvedValue({
      ok: false,
      status: 400,
      message: INVALID_FILE,
      errors: [{ field: "archivo", message: INVALID_FILE }],
    });
    await renderReadyStep();
    await completeForm(
      buildFile("falso.pdf", "application/pdf"),
      "diploma_academico",
    );

    submit();

    expect(await screen.findByText(INVALID_FILE)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/^Tipo de documento/)).toHaveValue(
        "diploma_academico",
      ),
    );
    expect(screen.getByText("falso.pdf")).toBeInTheDocument();
  });
});
