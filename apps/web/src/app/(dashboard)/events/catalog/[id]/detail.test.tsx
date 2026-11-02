import { within, fireEvent, render, screen } from '@testing-library/react';
import { EVENT_STATUS, type EventItem } from '@umsspira/shared-types';

import EventDetailPage from '@/features/events/event-detail-page';
import { ApiClientError } from '@/shared/services/api-client';
import { cancelEventRegistration, getPublishedEvent, registerForEvent } from '@/shared/services/events-service';
import { getCurrentUser } from '@/modules/auth/frontend/services/auth.service';
import { formatEventDateTime } from '@/shared/utils/event-date-time';

jest.mock('@/shared/services/events-service', () => ({
  getPublishedEvent: jest.fn(),
  registerForEvent: jest.fn(),
  cancelEventRegistration: jest.fn(),
}));

jest.mock('@/modules/auth/frontend/services/auth.service', () => ({
  getCurrentUser: jest.fn(),
}));

const EVENT_ID = '78869fe3-9744-41f6-a29e-fcf16e43c222';
const publishedEvent: EventItem = {
  id: EVENT_ID,
  title: 'Encuentro de titulados',
  description: 'Información real del evento',
  startDate: '2026-11-06T03:59:00.000Z',
  endDate: '2026-11-07T14:30:00.000Z',
  maxCapacity: 1,
  location: 'Campus Central',
  status: EVENT_STATUS.PUBLICADO,
  createdBy: 'admin-1',
  createdAt: '2026-10-01T10:00:00.000Z',
};

describe('detalle público de eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza un identificador malformado sin consultar la API', () => {
    render(<EventDetailPage params={{ id: 'no-es-un-uuid' }} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El identificador del evento no es válido.',
    );
    expect(screen.getByRole('link', { name: 'Regresar al catálogo' }))
      .toHaveAttribute('href', '/events/catalog');
    expect(getPublishedEvent).not.toHaveBeenCalled();
    expect(screen.queryByText(/Mock|Supabase|Tarea 11/i)).not.toBeInTheDocument();
  });

  it('permite volver al catálogo del portal cuando se abre desde el portal', () => {
    render(
      <EventDetailPage
        params={{ id: 'no-es-un-uuid' }}
        catalogHref="/portal/eventos"
      />,
    );

    expect(screen.getByRole('link', { name: 'Regresar al catálogo' }))
      .toHaveAttribute('href', '/portal/eventos');
  });

  it('muestra un estado no disponible para un UUID inexistente', async () => {
    jest.mocked(getPublishedEvent).mockRejectedValueOnce(
      new ApiClientError('detalle técnico', 404),
    );

    render(<EventDetailPage params={{ id: EVENT_ID }} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El evento no fue encontrado o ya no está disponible.',
    );
    expect(screen.queryByText('detalle técnico')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('permite reintentar un fallo temporal sin exponer el error interno', async () => {
    jest.mocked(getPublishedEvent)
      .mockRejectedValueOnce(new Error('fallo de Supabase'))
      .mockResolvedValueOnce(publishedEvent);

    render(<EventDetailPage params={{ id: EVENT_ID }} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar el evento en este momento.',
    );
    expect(screen.queryByText('fallo de Supabase')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(publishedEvent.title)).toBeInTheDocument();
    expect(getPublishedEvent).toHaveBeenCalledTimes(2);
  });

  it('muestra el evento publicado real con la misma hora local del catálogo', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce(publishedEvent);

    render(<EventDetailPage params={{ id: EVENT_ID }} />);

    expect(await screen.findByText(publishedEvent.title)).toBeInTheDocument();
    expect(screen.getByText(formatEventDateTime(publishedEvent.startDate)))
      .toBeInTheDocument();
    expect(screen.getByText(formatEventDateTime(publishedEvent.endDate)))
      .toBeInTheDocument();
    expect(screen.getByText('1 persona')).toBeInTheDocument();
    expect(screen.getAllByText(publishedEvent.description!)).toHaveLength(1);
    expect(screen.queryByText(/Mock|Supabase|Tarea 11/i)).not.toBeInTheDocument();
  });

  it('usa plural para capacidades distintas de uno', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce({
      ...publishedEvent,
      maxCapacity: 2,
    });

    render(<EventDetailPage params={{ id: EVENT_ID }} />);

    expect(await screen.findByText('2 personas')).toBeInTheDocument();
  });

  it('muestra la variante de cupo lleno sin permitir inscripción', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce({
      ...publishedEvent,
      maxCapacity: 40,
      currentCapacity: 40,
    });
    jest.mocked(getCurrentUser).mockResolvedValueOnce({ id: 'user-1', role: 'titulado' } as never);

    render(<EventDetailPage params={{ id: EVENT_ID }} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El evento alcanzó su cupo máximo. No se creará ningún registro de inscripción.',
    );
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sin cupos disponibles' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Volver al catálogo' }))
      .toHaveAttribute('href', '/events/catalog');
  });

  it('recupera el rol Titulado aunque no exista un token previo en memoria', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce(publishedEvent);
    jest.mocked(getCurrentUser).mockResolvedValueOnce({ id: 'user-1', role: 'titulado' } as never);

    render(<EventDetailPage params={{ id: EVENT_ID }} />);

    expect(await screen.findByRole('button', { name: 'Inscribirme' })).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('cierra la confirmación con Volver sin enviar la inscripción', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce(publishedEvent);
    jest.mocked(getCurrentUser).mockResolvedValueOnce({ id: 'user-1', role: 'titulado' } as never);

    render(<EventDetailPage params={{ id: EVENT_ID }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Inscribirme' }));

    expect(screen.getByRole('dialog', { name: 'Confirmar inscripción' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.queryByRole('dialog', { name: 'Confirmar inscripción' })).not.toBeInTheDocument();
    expect(registerForEvent).not.toHaveBeenCalled();
  });

  it('muestra el estado visual de inscripción confirmada', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce(publishedEvent);
    jest.mocked(getCurrentUser).mockResolvedValueOnce({ id: 'user-1', role: 'titulado' } as never);
    jest.mocked(registerForEvent).mockResolvedValueOnce({
      id: 'registration-1', eventId: EVENT_ID, status: 'CONFIRMADA',
      registeredAt: '2026-11-01T10:00:00.000Z', currentCapacity: 1,
    });

    render(<EventDetailPage params={{ id: EVENT_ID }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Inscribirme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inscripción' }));

    expect(await screen.findByRole('heading', { name: 'Inscripción confirmada' })).toBeInTheDocument();
    expect(screen.getByText('¡Ya eres parte del evento!')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMADA')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Descripción' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mis eventos' })).toHaveAttribute('href', '/portal/eventos/mis-eventos');
    expect(screen.getByRole('link', { name: 'Ver pase QR' })).toHaveAttribute('href', '/mis-pases');
  });

  it('muestra la variante visual de inscripción duplicada', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce(publishedEvent);
    jest.mocked(getCurrentUser).mockResolvedValueOnce({ id: 'user-1', role: 'titulado' } as never);
    jest.mocked(registerForEvent).mockRejectedValueOnce(
      new ApiClientError('duplicada', 409, 'EVENT_REGISTRATION_ALREADY_CONFIRMED'),
    );

    render(<EventDetailPage params={{ id: EVENT_ID }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Inscribirme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inscripción' }));

    expect(await screen.findByRole('heading', { name: 'Ya estás inscrito' })).toBeInTheDocument();
    expect(screen.getByText('INSCRIPCIÓN CONFIRMADA')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Confirmar inscripción' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mis eventos' })).toHaveAttribute('href', '/portal/eventos/mis-eventos');
    expect(screen.getByRole('link', { name: 'Ver pase QR' })).toHaveAttribute('href', '/mis-pases');
  });

  it('muestra un error seguro y permite reintentar sin dejar dos modales abiertos', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce(publishedEvent);
    jest.mocked(getCurrentUser).mockResolvedValueOnce({ id: 'user-1', role: 'titulado' } as never);
    jest.mocked(registerForEvent)
      .mockRejectedValueOnce(new ApiClientError('interno', 500))
      .mockResolvedValueOnce({
        id: 'registration-1', eventId: EVENT_ID, status: 'CONFIRMADA',
        registeredAt: '2026-11-01T10:00:00.000Z', currentCapacity: 1,
      });

    render(<EventDetailPage params={{ id: EVENT_ID }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Inscribirme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inscripción' }));

    expect(await screen.findByRole('heading', { name: 'No pudimos completar tu inscripción' }))
      .toBeInTheDocument();
    expect(screen.getByText(/No se realizaron cambios/)).toBeInTheDocument();
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Inscripción confirmada' }))
      .toBeInTheDocument();
    expect(registerForEvent).toHaveBeenCalledTimes(2);
  });

  it('muestra Evento no disponible con retorno al catálogo', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce(publishedEvent);
    jest.mocked(getCurrentUser).mockResolvedValueOnce({ id: 'user-1', role: 'titulado' } as never);
    jest.mocked(registerForEvent).mockRejectedValueOnce(
      new ApiClientError('no disponible', 409, 'EVENT_NOT_AVAILABLE'),
    );

    render(<EventDetailPage params={{ id: EVENT_ID }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Inscribirme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inscripción' }));

    expect(await screen.findByRole('heading', { name: 'Evento no disponible' }))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al catálogo' }))
      .toHaveAttribute('href', '/events/catalog');
  });

  it('actualiza la ocupación autoritativa cuando el backend informa cupo agotado', async () => {
    jest.mocked(getPublishedEvent)
      .mockResolvedValueOnce({ ...publishedEvent, maxCapacity: 40, currentCapacity: 39 })
      .mockResolvedValueOnce({ ...publishedEvent, maxCapacity: 40, currentCapacity: 40 });
    jest.mocked(getCurrentUser).mockResolvedValue({ id: 'user-1', role: 'titulado' } as never);
    jest.mocked(registerForEvent).mockRejectedValueOnce(
      new ApiClientError('sin cupos', 409, 'EVENT_CAPACITY_REACHED'),
    );

    render(<EventDetailPage params={{ id: EVENT_ID }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Inscribirme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inscripción' }));

    expect(await screen.findByRole('button', { name: 'Sin cupos disponibles' })).toBeDisabled();
    expect(screen.getByText('0 de 40')).toBeInTheDocument();
    expect(getPublishedEvent).toHaveBeenCalledTimes(2);
  });

  it('permite envolver títulos largos sin espacios en pantallas angostas', async () => {
    jest.mocked(getPublishedEvent).mockResolvedValueOnce({
      ...publishedEvent,
      title: 'QA_FINAL_HU12_0910_B',
    });

    render(<EventDetailPage params={{ id: EVENT_ID }} />);

    expect(await screen.findByRole('heading', {
      name: 'QA_FINAL_HU12_0910_B',
    })).toHaveClass('max-w-full', 'break-words');
  });
});


describe('Cancelación desde la inscripción confirmada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getPublishedEvent).mockResolvedValue({ ...publishedEvent, startDate: '2099-11-06T14:00:00Z', endDate: '2099-11-06T18:00:00Z' });
    jest.mocked(getCurrentUser).mockResolvedValue({ id: 'usuario-1', role: 'titulado' } as never);
    jest.mocked(registerForEvent).mockResolvedValue({
      id: 'inscripcion-1', eventId: EVENT_ID, status: 'CONFIRMADA',
      registeredAt: '2026-11-01T10:00:00Z', currentCapacity: 1,
    });
    jest.mocked(cancelEventRegistration).mockReset().mockResolvedValue(undefined);
  });

  async function registeredPage() {
    render(<EventDetailPage params={{ id: EVENT_ID }} catalogHref="/portal/eventos" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Inscribirme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inscripción' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar mi inscripción' }));
  }

  it('permite desistir y mantiene la inscripción confirmada sin enviar PATCH', async () => {
    await registeredPage();
    fireEvent.click(screen.getByRole('button', { name: 'Mantener inscripción' }));
    expect(screen.getByText('CONFIRMADA')).toBeInTheDocument();
    expect(cancelEventRegistration).not.toHaveBeenCalled();
  });

  it('cancela por ID de inscripción y actualiza el resultado visible', async () => {
    await registeredPage();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar inscripción' }));
    expect(await screen.findByRole('heading', { name: 'Inscripción cancelada' })).toBeInTheDocument();
    expect(cancelEventRegistration).toHaveBeenCalledWith('inscripcion-1');
    expect(screen.getByText('CANCELADA')).toBeInTheDocument();
    expect(screen.queryByText('CONFIRMADA')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toHaveAttribute('href', '/portal/eventos');
  });

  it('mantiene el estado visible ante un error de cancelación', async () => {
    jest.mocked(cancelEventRegistration).mockRejectedValue(new Error('Fallo de red'));
    await registeredPage();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar inscripción' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos confirmar la cancelación');
    expect(screen.getByText('CONFIRMADA')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inscripción cancelada' })).not.toBeInTheDocument();
  });
});
