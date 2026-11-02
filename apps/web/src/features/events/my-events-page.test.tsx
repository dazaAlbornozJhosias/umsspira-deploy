import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { MyEventRegistrationItem } from '@umsspira/shared-types';
import MyEventsPage from './my-events-page';
import { cancelEventRegistration, getMyEventRegistrations } from '@/shared/services/events-service';
import { ApiClientError } from '@/shared/services/api-client';

jest.mock('@/shared/services/events-service', () => ({
  getMyEventRegistrations: jest.fn(),
  cancelEventRegistration: jest.fn(),
}));

const registration: MyEventRegistrationItem = {
  id: 'inscripcion-1',
  status: 'CONFIRMADA',
  participationStatus: 'VIGENTE',
  registeredAt: '2026-10-01T12:00:00Z',
  hasPass: true,
  event: {
    id: 'evento-1',
    title: 'Feria de empleo',
    startDate: '2099-11-12T13:00:00Z',
    endDate: '2099-11-12T21:00:00Z',
    location: 'Campus Central',
    status: 'PUBLICADO',
  },
};

async function openConfirmation() {
  const trigger = await screen.findByRole('button', { name: 'Cancelar inscripción' });
  trigger.focus();
  fireEvent.click(trigger);
  return screen.getByRole('alertdialog');
}

describe('Cancelación desde Mis eventos', () => {
  it.each([
    [401, 'Inicia sesión para ver tus eventos'],
    [403, 'Esta sección requiere una cuenta de Titulado'],
    [500, 'No pudimos cargar tus eventos'],
  ])('identifica el error de carga %s sin confundirlo con una lista vacía', async (status, title) => {
    jest.mocked(getMyEventRegistrations).mockRejectedValue(new ApiClientError('interno', status as number));
    render(<MyEventsPage />);
    expect(await screen.findByRole('heading', { name: title as string })).toBeInTheDocument();
    expect(screen.queryByText('Aún no estás inscrito en ningún evento')).not.toBeInTheDocument();
    if (status === 401) expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getMyEventRegistrations).mockResolvedValue([registration]);
    jest.mocked(cancelEventRegistration).mockResolvedValue(undefined);
  });

  it('identifica el evento y permite desistir sin cambiar la inscripción', async () => {
    render(<MyEventsPage />);
    const dialog = await openConfirmation();
    expect(within(dialog).getByText(registration.event.title)).toBeInTheDocument();
    expect(within(dialog).getByText(registration.event.location!)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mantener inscripción' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText('CONFIRMADA')).toBeInTheDocument();
    expect(cancelEventRegistration).not.toHaveBeenCalled();
  });

  it('espera al servidor, cancela por ID de inscripción y actualiza el filtro de cancelados', async () => {
    let resolve!: () => void;
    jest.mocked(cancelEventRegistration).mockImplementation(() => new Promise<void>((done) => { resolve = done; }));
    render(<MyEventsPage />);
    const dialog = await openConfirmation();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar inscripción' }));
    expect(cancelEventRegistration).toHaveBeenCalledWith('inscripcion-1');
    expect(screen.getByText('CONFIRMADA')).toBeInTheDocument();
    expect(screen.queryByText('Inscripción cancelada')).not.toBeInTheDocument();
    await act(async () => resolve());
    expect(screen.getByText('CANCELADA')).toBeInTheDocument();
    expect(screen.queryByText('CONFIRMADA')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inscripción cancelada' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Explorar eventos' })).toHaveAttribute('href', '/portal/eventos');
    expect(screen.queryByRole('button', { name: 'Ver pase' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar inscripción' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a mis eventos' }));
    fireEvent.click(screen.getByRole('button', { name: 'CANCELADOS' }));
    expect(screen.getByText('1 evento cancelado')).toBeInTheDocument();
    expect(screen.getByText('INSCRIPCIÓN CANCELADA')).toBeInTheDocument();
    expect(getMyEventRegistrations).toHaveBeenCalledTimes(1);
  });

  it('conserva el estado visible ante un error y permite reintentar', async () => {
    jest.mocked(cancelEventRegistration).mockRejectedValueOnce(new Error('sin conexión'));
    render(<MyEventsPage />);
    const dialog = await openConfirmation();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar inscripción' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos confirmar la cancelación');
    expect(screen.getByText('CONFIRMADA')).toBeInTheDocument();
    expect(screen.queryByText('INSCRIPCIÓN CANCELADA')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Inscripción cancelada')).toBeInTheDocument();
    expect(cancelEventRegistration).toHaveBeenCalledTimes(2);
  });

  it('no marca como cancelada una solicitud rechazada por el servidor', async () => {
    jest.mocked(cancelEventRegistration).mockRejectedValue(new ApiClientError('interno', 404));
    render(<MyEventsPage />);
    const dialog = await openConfirmation();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar inscripción' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se encontró una inscripción disponible');
    expect(screen.getByText('CONFIRMADA')).toBeInTheDocument();
    expect(screen.queryByText('Inscripción cancelada')).not.toBeInTheDocument();
  });

  it('sincroniza el 409 cuando otro dispositivo ya canceló sin repetir la operación', async () => {
    jest.mocked(getMyEventRegistrations)
      .mockResolvedValueOnce([registration])
      .mockResolvedValueOnce([{ ...registration, status: 'CANCELADA', participationStatus: 'INSCRIPCION_CANCELADA' }]);
    jest.mocked(cancelEventRegistration).mockRejectedValue(
      new ApiClientError('ya cancelada', 409, 'EVENT_REGISTRATION_NOT_CONFIRMED'),
    );
    render(<MyEventsPage />);
    const dialog = await openConfirmation();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar inscripción' }));
    expect(await screen.findByText('INSCRIPCIÓN CANCELADA')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Mostramos el estado actualizado');
    expect(screen.queryByText('CONFIRMADA')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar inscripción' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inscripción cancelada' })).not.toBeInTheDocument();
    expect(getMyEventRegistrations).toHaveBeenCalledTimes(2);
    expect(cancelEventRegistration).toHaveBeenCalledTimes(1);
  });

  it('muestra error si no puede consultar el estado tras un 409, sin informar éxito', async () => {
    jest.mocked(getMyEventRegistrations)
      .mockResolvedValueOnce([registration])
      .mockRejectedValueOnce(new Error('sin conexión'));
    jest.mocked(cancelEventRegistration).mockRejectedValue(new ApiClientError('conflicto', 409));
    render(<MyEventsPage />);
    const dialog = await openConfirmation();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar inscripción' }));
    expect(await screen.findByRole('heading', { name: 'No pudimos cargar tus eventos' })).toBeInTheDocument();
    expect(screen.queryByText(/Mostramos el estado actualizado/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inscripción cancelada' })).not.toBeInTheDocument();
    expect(cancelEventRegistration).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it.each([
    { ...registration, status: 'CANCELADA', participationStatus: 'INSCRIPCION_CANCELADA' },
    { ...registration, participationStatus: 'EVENTO_CANCELADO', event: { ...registration.event, status: 'CANCELADO' } },
    { ...registration, participationStatus: 'FINALIZADO', event: { ...registration.event, endDate: '2020-01-01T12:00:00Z' } },
  ] satisfies MyEventRegistrationItem[])('no ofrece cancelación para $participationStatus', async (item) => {
    jest.mocked(getMyEventRegistrations).mockResolvedValue([item]);
    render(<MyEventsPage />);
    await screen.findByRole('heading', { name: registration.event.title });
    expect(screen.queryByRole('button', { name: 'Cancelar inscripción' })).not.toBeInTheDocument();
    expect(cancelEventRegistration).not.toHaveBeenCalled();
  });

  it('actualiza únicamente la inscripción seleccionada entre varios eventos', async () => {
    jest.mocked(getMyEventRegistrations).mockResolvedValue([
      registration,
      { ...registration, id: 'inscripcion-2', event: { ...registration.event, id: 'evento-2', title: 'Taller de tecnología' } },
    ]);
    render(<MyEventsPage />);
    await screen.findByText('Taller de tecnología');
    const card = screen.getAllByRole('article')[1];
    fireEvent.click(within(card).getByRole('button', { name: 'Cancelar inscripción' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar inscripción' }));
    await screen.findByText('Inscripción cancelada');
    expect(cancelEventRegistration).toHaveBeenCalledWith('inscripcion-2');
    fireEvent.click(screen.getByRole('button', { name: 'Volver a mis eventos' }));
    expect(within(screen.getAllByRole('article')[0]).getByText('CONFIRMADA')).toBeInTheDocument();
    expect(within(screen.getAllByRole('article')[1]).getByText('INSCRIPCIÓN CANCELADA')).toBeInTheDocument();
    expect(cancelEventRegistration).toHaveBeenCalledTimes(1);
  });
});
