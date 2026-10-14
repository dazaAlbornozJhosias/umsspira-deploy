import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DocumentUploadStep, REGISTER_PATH, VERIFY_EMAIL_PATH } from './document-upload-step';
import { useRegistrationStore } from '@/modules/registration/frontend/store';
import { submitRegistration, uploadDocument } from '../services';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../services', () => ({
  ...jest.requireActual('../services'),
  uploadDocument: jest.fn(),
  submitRegistration: jest.fn(),
}));

const mockedUpload = uploadDocument as jest.Mock;
const mockedSubmit = submitRegistration as jest.Mock;
const INVALID_FILE = 'Formato o tamaño no permitido. Adjunta un documento en PDF, PNG o JPG de máximo 5 MB';
const SESSION_TOKEN = '22222222-2222-4222-8222-222222222222';

function buildFile(name: string, type: string, size = 2048) {
  const file = new File(['contenido'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function chooseFile(file: File, testId = 'document-input') {
  fireEvent.change(screen.getByTestId(testId), { target: { files: [file] } });
}

async function renderReadyStep() {
  render(<DocumentUploadStep />);
  await screen.findByLabelText(/^Tipo de documento/);
}

function completeForm(file = buildFile('titulo.pdf', 'application/pdf'), type = 'titulo_provision_nacional') {
  fireEvent.change(screen.getByLabelText(/^Tipo de documento/), { target: { value: type } });
  chooseFile(file);
  fireEvent.click(screen.getByLabelText(/Declaro bajo juramento/));
  return file;
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /Finalizar y enviar solicitud/ }));
}

describe('DocumentUploadStep', () => {
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

  it('pide completar los datos cuando no existe un registro en curso', async () => {
    useRegistrationStore.getState().reset();
    render(<DocumentUploadStep />);

    fireEvent.click(await screen.findByRole('button', { name: 'Completar mis datos' }));
    expect(mockPush).toHaveBeenCalledWith(REGISTER_PATH);
  });

  it('no envía sin tipo de documento, archivo ni declaración jurada (CA-03.5)', async () => {
    await renderReadyStep();

    submit();

    expect(screen.getByText('Selecciona el tipo de documento')).toBeInTheDocument();
    expect(screen.getByText('Adjunta tu documento de respaldo')).toBeInTheDocument();
    expect(screen.getByText('Debes aceptar la declaración jurada para enviar tu solicitud.')).toBeInTheDocument();
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it('muestra la vista previa local con el botón de reemplazo al elegir un archivo (CA-03.4)', async () => {
    await renderReadyStep();

    chooseFile(buildFile('diploma.png', 'image/png'));

    expect(screen.getByRole('img', { name: 'Vista previa de diploma.png' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reemplazar archivo/ })).toBeInTheDocument();
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it('acepta un archivo arrastrado a la zona de carga', async () => {
    await renderReadyStep();

    fireEvent.drop(screen.getByTestId('document-drop-area'), {
      dataTransfer: { files: [buildFile('titulo.pdf', 'application/pdf')] },
    });

    expect(screen.getByText('titulo.pdf')).toBeInTheDocument();
  });

  it('rechaza un archivo de más de 5 MB o con formato no permitido (CA-03.3)', async () => {
    await renderReadyStep();

    chooseFile(buildFile('titulo.pdf', 'application/pdf', 5 * 1024 * 1024 + 1));
    expect(screen.getByText(INVALID_FILE)).toBeInTheDocument();

    chooseFile(buildFile('titulo.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
    expect(screen.getByText(INVALID_FILE)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reemplazar archivo/ })).not.toBeInTheDocument();
  });

  it('conserva el archivo anterior si el reemplazo no es válido y libera la vista previa al reemplazar', async () => {
    await renderReadyStep();
    chooseFile(buildFile('diploma.png', 'image/png'));

    chooseFile(buildFile('virus.exe', 'application/octet-stream'), 'replace-document-input');
    expect(screen.getByText(INVALID_FILE)).toBeInTheDocument();
    expect(screen.getByText('diploma.png')).toBeInTheDocument();

    chooseFile(buildFile('titulo.pdf', 'application/pdf'), 'replace-document-input');
    expect(screen.getByText('titulo.pdf')).toBeInTheDocument();
    expect(screen.queryByText(INVALID_FILE)).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('registra la solicitud y muestra la confirmación con los datos del envío (CA-03.2)', async () => {
    useRegistrationStore.getState().setPersonalData({
      nombres: 'Juan',
      apellidos: 'Pérez Rojas',
      ci: '1234567',
      complementoCi: '',
      expedidoEn: 'CB',
      correo: 'juanperez@gmail.com',
      telefono: '71234567',
      carreraId: 'carrera-1',
      anioEgreso: 2020,
      codigoSis: '201900001',
    });
    const file = buildFile('titulo.pdf', 'application/pdf');
    mockedUpload.mockResolvedValue({
      ok: true,
      document: {
        path: 'solicitudes/x/y.pdf',
        tipoDocumento: 'titulo_provision_nacional',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        originalName: 'titulo.pdf',
      },
    });
    const submission = { idSolicitud: 'abcdef12-3456-4789-8123-456789abcdef', estado: 'Pendiente', mensaje: 'ok' };
    mockedSubmit.mockResolvedValue({ ok: true, submission });
    await renderReadyStep();
    completeForm(file);

    submit();

    expect(await screen.findByText('¡Solicitud enviada con éxito!')).toBeInTheDocument();
    expect(mockedUpload).toHaveBeenCalledWith({ sessionToken: SESSION_TOKEN, tipoDocumento: 'titulo_provision_nacional', file });
    expect(mockedSubmit).toHaveBeenCalledWith({
      sessionToken: SESSION_TOKEN,
      tipoDocumento: 'titulo_provision_nacional',
      rutaStorage: 'solicitudes/x/y.pdf',
      sizeBytes: 2048,
      mimeType: 'application/pdf',
    });
    expect(screen.getByText('Juan Pérez Rojas')).toBeInTheDocument();
    expect(screen.getByText('ju****z@gmail.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ir al inicio' }));
    expect(mockPush).toHaveBeenCalledWith('/');
    expect(useRegistrationStore.getState().sessionToken).toBeNull();
  });

  it('cierra el modal y ofrece volver al inicio sin perder el registro', async () => {
    mockedUpload.mockResolvedValue({
      ok: true,
      document: {
        path: 'solicitudes/x/y.pdf',
        tipoDocumento: 'titulo_provision_nacional',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        originalName: 'titulo.pdf',
      },
    });
    mockedSubmit.mockResolvedValue({
      ok: true,
      submission: { idSolicitud: 'abcdef12-3456-4789-8123-456789abcdef', estado: 'Pendiente', mensaje: 'ok' },
    });
    await renderReadyStep();
    completeForm();

    submit();
    expect(await screen.findByText('¡Solicitud enviada con éxito!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(await screen.findByText('Tu solicitud fue registrada correctamente.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ir al inicio' }));
    expect(mockPush).toHaveBeenCalledWith('/');
    expect(useRegistrationStore.getState().sessionToken).toBeNull();
  });

  it('avisa el vencimiento cuando la sesión expiró al enviar (CA-01.6)', async () => {
    mockedUpload.mockResolvedValue({
      ok: true,
      document: {
        path: 'solicitudes/x/y.pdf',
        tipoDocumento: 'titulo_provision_nacional',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        originalName: 'titulo.pdf',
      },
    });
    const expired = 'El tiempo para completar tu registro venció. Debes llenar el formulario desde el inicio.';
    mockedSubmit.mockResolvedValue({ ok: false, status: 410, message: expired, errors: [] });
    await renderReadyStep();
    completeForm();

    submit();

    expect(await screen.findByText(expired)).toBeInTheDocument();
    expect(useRegistrationStore.getState().sessionToken).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Volver al formulario' }));
    expect(mockPush).toHaveBeenCalledWith(REGISTER_PATH);
  });

  it('muestra el duplicado detectado al enviar sin perder lo elegido (CA-03.6)', async () => {
    mockedUpload.mockResolvedValue({
      ok: true,
      document: {
        path: 'solicitudes/x/y.pdf',
        tipoDocumento: 'diploma_academico',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        originalName: 'diploma.pdf',
      },
    });
    const message = 'Este correo electrónico ya está registrado en otra solicitud';
    mockedSubmit.mockResolvedValue({ ok: false, status: 409, message, errors: [{ field: 'correo', message }] });
    await renderReadyStep();
    completeForm(buildFile('diploma.pdf', 'application/pdf'), 'diploma_academico');

    submit();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByText('diploma.pdf')).toBeInTheDocument();
  });

  it('dirige a la verificación de correo si el servidor indica que no está verificado (CA-03.1)', async () => {
    mockedUpload.mockResolvedValue({
      ok: false,
      status: 403,
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Debes verificar tu correo antes de adjuntar tu documento',
      errors: [],
    });
    await renderReadyStep();
    completeForm();

    submit();

    expect(await screen.findByText('Debes verificar tu correo antes de adjuntar tu documento')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Verificar mi correo' }));
    expect(mockPush).toHaveBeenCalledWith(VERIFY_EMAIL_PATH);
  });

  it('muestra el rechazo del servidor en el campo archivo y conserva lo elegido', async () => {
    mockedUpload.mockResolvedValue({
      ok: false,
      status: 400,
      message: INVALID_FILE,
      errors: [{ field: 'archivo', message: INVALID_FILE }],
    });
    await renderReadyStep();
    completeForm(buildFile('falso.pdf', 'application/pdf'), 'diploma_academico');

    submit();

    expect(await screen.findByText(INVALID_FILE)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/^Tipo de documento/)).toHaveValue('diploma_academico'));
    expect(screen.getByText('falso.pdf')).toBeInTheDocument();
  });
});
