import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CONFIRMATION_PATH,
  PREVIOUS_STEP_PATH,
  REGISTER_PATH,
  RegistrationReview,
} from './registration-review';
import { useRegistrationStore } from '../store';
import { fetchCareers, updateRegistrationSession } from '../services';
import { submitRegistration } from '@/modules/documents/frontend/services';

const mockPush = jest.fn();

jest.mock('./review-document-preview', () => ({ ReviewDocumentPreview: () => <div>Vista previa</div> }));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../services', () => ({
  fetchCareers: jest.fn(),
  updateRegistrationSession: jest.fn(),
}));

jest.mock('@/modules/documents/frontend/services', () => ({
  ...jest.requireActual('@/modules/documents/frontend/services'),
  submitRegistration: jest.fn(),
}));

const mockedFetchCareers = fetchCareers as jest.Mock;
const mockedUpdate = updateRegistrationSession as jest.Mock;
const mockedSubmit = submitRegistration as jest.Mock;

const CAREER_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_TOKEN = '22222222-2222-4222-8222-222222222222';

const PERSONAL_DATA = {
  nombres: 'Juan Carlos',
  apellidos: 'Pérez Mamani',
  ci: '6842109',
  complementoCi: 'CB',
  expedidoEn: 'CB',
  correo: 'juan.perez@example.com',
  telefono: '70745821',
  carreraId: CAREER_ID,
  anioEgreso: 2023,
  codigoSis: '201804921',
};

const DOCUMENT = {
  tipoDocumento: 'titulo_provision_nacional' as const,
  path: 'solicitudes/x/y.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 2_516_582,
  originalName: 'titulo_academico.pdf',
  previewUrl: null,
  previewKind: 'pdf' as const,
};

function prepareStore({ withDocument = true, verified = true } = {}) {
  const store = useRegistrationStore.getState();
  store.setSessionToken(SESSION_TOKEN);
  store.setPersonalData(PERSONAL_DATA);
  if (withDocument) store.setDocument(DOCUMENT);
  if (verified) store.setVerifiedEmail(PERSONAL_DATA.correo);
}

function renderReview() {
  render(<RegistrationReview />);
}

async function renderReadyReview() {
  renderReview();
  await screen.findByText('Revisión de solicitud');
}

describe('RegistrationReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUpdate.mockResolvedValue({ ok: true, verifiedEmail: PERSONAL_DATA.correo });
    localStorage.clear();
    useRegistrationStore.getState().reset();
    mockedFetchCareers.mockResolvedValue([{ id: CAREER_ID, nombre: 'Licenciatura en Ingeniería de Sistemas' }]);
  });

  it('muestra los datos personales, académicos y el documento (CA-07.2)', async () => {
    prepareStore();
    await renderReadyReview();

    expect(screen.getByText('1. Datos Personales')).toBeInTheDocument();
    expect(screen.getByText('2. Contacto e Información Académica')).toBeInTheDocument();
    expect(screen.getByText('3. Documento de Respaldo')).toBeInTheDocument();
    expect(screen.getByText('Juan Carlos')).toBeInTheDocument();
    expect(screen.getByText('Pérez Mamani')).toBeInTheDocument();
    expect(screen.getByText('6842109')).toBeInTheDocument();
    expect(screen.getByText('juan.perez@example.com')).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(await screen.findByText('Licenciatura en Ingeniería de Sistemas')).toBeInTheDocument();
    expect(screen.getByText('201804921')).toBeInTheDocument();
    expect(screen.getByText('titulo_academico.pdf')).toBeInTheDocument();
  });

  it('no permite entregar mientras el correo no esté verificado', async () => {
    prepareStore({ verified: false });
    await renderReadyReview();

    expect(screen.getByText('Pendiente de verificación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entregar solicitud/ })).toBeDisabled();
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('entrega la solicitud una vez y navega a la confirmación (CA-07.5)', async () => {
    prepareStore();
    mockedSubmit.mockResolvedValue({
      ok: true,
      submission: { idSolicitud: 'abcdef12-3456-4789-8123-456789abcdef', estado: 'Pendiente', mensaje: 'ok' },
    });
    await renderReadyReview();

    fireEvent.click(screen.getByRole('button', { name: /Entregar solicitud/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(CONFIRMATION_PATH));
    expect(mockedSubmit).toHaveBeenCalledWith({
      sessionToken: SESSION_TOKEN,
      tipoDocumento: 'titulo_provision_nacional',
      rutaStorage: 'solicitudes/x/y.pdf',
      sizeBytes: 2_516_582,
      mimeType: 'application/pdf',
    });
    expect(useRegistrationStore.getState().confirmation).toEqual(
      expect.objectContaining({
        estado: 'Pendiente',
        nombreCompleto: 'Juan Carlos Pérez Mamani',
        ci: '6842109 CB',
        correoEnmascarado: 'ju****z@example.com',
      }),
    );
  });

  it('muestra el mensaje del servidor si la entrega falla (CA-07.5)', async () => {
    prepareStore();
    const message = 'Este correo electrónico ya está registrado en otra solicitud';
    mockedSubmit.mockResolvedValue({ ok: false, status: 409, message, errors: [{ field: 'correo', message }] });
    await renderReadyReview();

    fireEvent.click(screen.getByRole('button', { name: /Entregar solicitud/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('pide completar los datos cuando no hay una sesión de registro', async () => {
    renderReview();

    fireEvent.click(await screen.findByRole('button', { name: 'Completar mis datos' }));
    expect(mockPush).toHaveBeenCalledWith(REGISTER_PATH);
  });

  it('pide cargar el documento cuando falta el paso 3', async () => {
    prepareStore({ withDocument: false });
    renderReview();

    fireEvent.click(await screen.findByRole('button', { name: 'Cargar documento' }));
    expect(mockPush).toHaveBeenCalledWith(PREVIOUS_STEP_PATH);
  });

  it('permite volver al paso previo sin registrar la solicitud', async () => {
    prepareStore();
    await renderReadyReview();

    fireEvent.click(screen.getByRole('button', { name: /Volver al paso previo/ }));
    expect(mockPush).toHaveBeenCalledWith(PREVIOUS_STEP_PATH);
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('edita los datos personales en la misma pantalla y conserva el resto (CA-07.3)', async () => {
    prepareStore();
    await renderReadyReview();

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar datos' })[0]);
    fireEvent.change(screen.getByLabelText(/^Nombres/), { target: { value: 'Ana Lucía' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(screen.getByText('Ana Lucía')).toBeInTheDocument());
    expect(useRegistrationStore.getState().personalData).toEqual(
      expect.objectContaining({
        nombres: 'Ana Lucía',
        apellidos: 'Pérez Mamani',
        correo: 'juan.perez@example.com',
      }),
    );
    expect(mockedUpdate).toHaveBeenCalledWith(SESSION_TOKEN, expect.objectContaining({ nombres: 'Ana Lucía' }));
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('no anuncia cambios guardados si falla el backend', async () => {
    prepareStore();
    mockedUpdate.mockResolvedValueOnce({ ok: false, message: 'No se pudieron guardar los cambios.' });
    await renderReadyReview();
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar datos' })[0]);
    fireEvent.change(screen.getByLabelText(/^Nombres/), { target: { value: 'Maria' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron guardar');
    expect(useRegistrationStore.getState().personalData?.nombres).toBe(PERSONAL_DATA.nombres);
    expect(screen.getByRole('button', { name: /Entregar solicitud/ })).toBeDisabled();
  });

  it('marca el correo como pendiente y pide verificarlo si cambia (CA-07.4)', async () => {
    prepareStore();
    await renderReadyReview();

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar datos' })[1]);
    fireEvent.change(screen.getByLabelText(/^Correo electrónico/), { target: { value: 'nuevo.correo@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/register/verify-email?mode=update'));
    expect(useRegistrationStore.getState().personalData?.correo).toBe('nuevo.correo@example.com');
    expect(useRegistrationStore.getState().verifiedEmail).toBe('juan.perez@example.com');
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('permite conservar el correo anteriormente verificado (CA-07.4)', async () => {
    prepareStore();
    useRegistrationStore.getState().setPersonalData({ ...PERSONAL_DATA, correo: 'nuevo.correo@example.com' });
    await renderReadyReview();

    expect(screen.getByText('Pendiente de verificación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entregar solicitud/ })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Usar el correo anterior' }));

    await waitFor(() =>
      expect(useRegistrationStore.getState().personalData?.correo).toBe('juan.perez@example.com'),
    );
    await waitFor(() => expect(screen.getByText('Verificado')).toBeInTheDocument());
  });
});
