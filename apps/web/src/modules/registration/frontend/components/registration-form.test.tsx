import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RegistrationForm, VERIFY_EMAIL_PATH } from './registration-form';
import { useRegistrationStore } from '../store';
import { checkRegistrationSession, createRegistrationSession, fetchCareers } from '../services';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../services', () => ({
  fetchCareers: jest.fn(),
  createRegistrationSession: jest.fn(),
  checkRegistrationSession: jest.fn(),
}));

jest.mock('@/modules/email-verification/frontend/store', () => ({
  useEmailVerificationStore: {
    getState: () => ({ setEmail: jest.fn(), setSessionToken: jest.fn() }),
  },
}));

const mockedFetchCareers = fetchCareers as jest.Mock;
const mockedCreateSession = createRegistrationSession as jest.Mock;
const mockedCheckSession = checkRegistrationSession as jest.Mock;

const CAREER_ID = '11111111-1111-4111-8111-111111111111';

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/^Nombres/), { target: { value: 'Juan' } });
  fireEvent.change(screen.getByLabelText(/^Apellidos/), { target: { value: 'Pérez' } });
  fireEvent.change(screen.getByLabelText(/^Número de C\.I\./), { target: { value: '1234567' } });
  fireEvent.change(screen.getByLabelText(/^Expedido en/), { target: { value: 'CB' } });
  fireEvent.change(screen.getByLabelText(/^Correo electrónico/), { target: { value: 'Juan.Perez@Example.com' } });
  fireEvent.change(screen.getByLabelText(/^Teléfono/), { target: { value: '71234567' } });
  fireEvent.change(screen.getByLabelText(/^Carrera/), { target: { value: CAREER_ID } });
  fireEvent.change(screen.getByLabelText(/^Año de egreso/), { target: { value: '2020' } });
  fireEvent.change(screen.getByLabelText(/^Código SIS/), { target: { value: '201900001' } });
}

async function renderForm() {
  render(<RegistrationForm />);
  await screen.findByRole('option', { name: 'Ingeniería de Sistemas' });
}

describe('RegistrationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useRegistrationStore.getState().reset();
    mockedFetchCareers.mockResolvedValue([{ id: CAREER_ID, nombre: 'Ingeniería de Sistemas' }]);
    mockedCheckSession.mockResolvedValue({ status: 'unknown' });
  });

  it('muestra los 10 campos del formulario con el año de egreso desde 1970 hasta el año actual', async () => {
    await renderForm();

    [
      /^Nombres/,
      /^Apellidos/,
      /^Número de C\.I\./,
      /^Complemento de C\.I\. \(Opcional\)/,
      /^Expedido en/,
      /^Correo electrónico/,
      /^Teléfono/,
      /^Carrera/,
      /^Año de egreso/,
      /^Código SIS/,
    ].forEach((label) => expect(screen.getByLabelText(label)).toBeInTheDocument());

    const yearSelect = screen.getByLabelText(/^Año de egreso/);
    const currentYear = String(new Date().getFullYear());
    expect(yearSelect).toContainElement(screen.getByRole('option', { name: currentYear }));
    expect(yearSelect).toContainElement(screen.getByRole('option', { name: '1970' }));
    expect(screen.getByRole('option', { name: 'Extranjero' })).toBeInTheDocument();
  });

  it('no avanza y marca los campos obligatorios cuando se envía vacío (CA-01.3)', async () => {
    await renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findAllByText('Este campo es obligatorio.')).not.toHaveLength(0);
    expect(mockedCreateSession).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('valida el formato del correo, C.I., teléfono y Código SIS conservando lo escrito (CA-01.3)', async () => {
    await renderForm();
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/^Correo electrónico/), { target: { value: 'juan.perez' } });
    fireEvent.change(screen.getByLabelText(/^Número de C\.I\./), { target: { value: '12a45' } });
    fireEvent.change(screen.getByLabelText(/^Teléfono/), { target: { value: '7123' } });
    fireEvent.change(screen.getByLabelText(/^Código SIS/), { target: { value: 'ABC123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Ingresa un correo electrónico válido.')).toBeInTheDocument();
    expect(screen.getByText('El C.I. debe tener entre 5 y 10 dígitos, sin puntos ni guiones.')).toBeInTheDocument();
    expect(screen.getByText('El teléfono debe tener 8 dígitos.')).toBeInTheDocument();
    expect(screen.getByText('El Código SIS debe tener de 6 a 9 dígitos.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Correo electrónico/)).toHaveValue('juan.perez');
    expect(mockedCreateSession).not.toHaveBeenCalled();
  });

  it('guarda la sesión y dirige a la verificación de correo cuando los datos son válidos (CA-01.1)', async () => {
    mockedCreateSession.mockResolvedValue({ ok: true, sessionToken: 'token-123', expiresInSeconds: 7200 });
    await renderForm();
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(VERIFY_EMAIL_PATH));
    expect(mockedCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        correo: 'juan.perez@example.com',
        anioEgreso: 2020,
        complementoCi: undefined,
        carreraId: CAREER_ID,
      }),
    );
    expect(useRegistrationStore.getState().sessionToken).toBe('token-123');
    expect(useRegistrationStore.getState().personalData?.correo).toBe('juan.perez@example.com');
  });

  it('resalta solo el campo duplicado que indica el servidor (CA-01.4)', async () => {
    const message = 'El documento de identidad ingresado ya cuenta con una solicitud registrada';
    mockedCreateSession.mockResolvedValue({ ok: false, message, errors: [{ field: 'ci', message }] });
    await renderForm();
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Número de C\.I\./)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/^Correo electrónico/)).toHaveAttribute('aria-invalid', 'false');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('muestra un aviso general cuando el servidor no está disponible', async () => {
    mockedCreateSession.mockResolvedValue({
      ok: false,
      message: 'No se pudo verificar la información en este momento, intenta nuevamente',
      errors: [],
    });
    await renderForm();
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo verificar la información');
  });

  it('avisa que el registro venció cuando pasaron más de 2 horas (CA-01.6)', async () => {
    const expired = 'El tiempo para completar tu registro venció. Debes llenar el formulario desde el inicio.';
    useRegistrationStore.getState().setSessionToken('token-vencido');
    mockedCheckSession.mockResolvedValue({ status: 'expired', message: expired });

    await renderForm();

    expect(await screen.findByText(expired)).toBeInTheDocument();
    expect(useRegistrationStore.getState().sessionToken).toBeNull();
  });

  it('permite retomar un registro vigente con los datos ya cargados', async () => {
    useRegistrationStore.getState().setSessionToken('token-vigente');
    useRegistrationStore.getState().setPersonalData({
      nombres: 'Ana',
      apellidos: 'Rojas',
      ci: '7654321',
      complementoCi: '',
      expedidoEn: 'LP',
      correo: 'ana@example.com',
      telefono: '76543210',
      carreraId: CAREER_ID,
      anioEgreso: 2019,
      codigoSis: '201800001',
    });
    mockedCheckSession.mockResolvedValue({ status: 'active', expiresInSeconds: 3600 });

    await renderForm();

    expect(await screen.findByText(/Tienes un registro en curso/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/^Nombres/)).toHaveValue('Ana'));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar verificación' }));
    expect(mockPush).toHaveBeenCalledWith(VERIFY_EMAIL_PATH);
  });

  it('avisa cuando la base de datos todavía no tiene carreras registradas', async () => {
    mockedFetchCareers.mockResolvedValue([]);
    render(<RegistrationForm />);

    expect(await screen.findByText('Aún no hay carreras registradas. Intenta nuevamente más tarde.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Carrera/)).toBeDisabled();
  });

  it('informa cuando no se pudo cargar el catálogo de carreras', async () => {
    mockedFetchCareers.mockRejectedValue(new Error('503'));
    render(<RegistrationForm />);

    expect(
      await screen.findByText('No se pudieron cargar las carreras. Intenta nuevamente en unos minutos.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Carrera/)).toBeDisabled();
  });
});
