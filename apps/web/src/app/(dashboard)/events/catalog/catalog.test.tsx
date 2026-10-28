import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EVENT_STATUS, type EventItem } from '@umsspira/shared-types';
import EventsCatalogPage from './page';
import { getEventCatalog } from '@/shared/services/events-service';
import { getEventMonthKey } from '@/shared/utils/event-date-time';
import PortalEventsCatalogPage from '@/features/events/events-catalog-page';

jest.mock('@/shared/services/events-service', () => ({
  getEventCatalog: jest.fn(),
}));

const catalogEvents: EventItem[] = [
  {
    id: 'event-october',
    title: 'Feria de empleo',
    description: 'Encuentro profesional',
    startDate: '2026-10-12T09:00:00Z',
    endDate: '2026-10-12T12:00:00Z',
    maxCapacity: 100,
    location: 'Campus Central',
    status: EVENT_STATUS.PUBLICADO,
    createdBy: 'admin-1',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'event-november',
    title: 'Taller de tecnología',
    description: 'Capacitación abierta',
    startDate: '2026-11-15T14:00:00Z',
    endDate: '2026-11-15T17:00:00Z',
    maxCapacity: 50,
    location: 'Laboratorio',
    status: EVENT_STATUS.PUBLICADO,
    createdBy: 'admin-1',
    createdAt: '2026-10-02T10:00:00Z',
  },
];

describe('catálogo de eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getEventCatalog).mockResolvedValue(catalogEvents);
  });

  it('aplica la búsqueda y el mes seleccionado en el calendario', async () => {
    render(<EventsCatalogPage />);

    expect(await screen.findAllByText('Feria de empleo')).not.toHaveLength(0);
    expect(screen.getAllByText('Taller de tecnología')).not.toHaveLength(0);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar eventos' }), {
      target: { value: 'tecnología' },
    });
    fireEvent.change(screen.getByLabelText('Filtrar por mes'), {
      target: { value: '2026-11' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getAllByText('Taller de tecnología')).not.toHaveLength(0);
    expect(screen.queryAllByText('Feria de empleo')).toHaveLength(0);
    expect(screen.getByText('1 evento disponible · 0 no disponibles')).toBeInTheDocument();
  });

  it('envía los filtros al presionar Enter en la búsqueda', async () => {
    render(<EventsCatalogPage />);
    await screen.findAllByText('Feria de empleo');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar eventos' }), {
      target: { value: 'feria' },
    });
    fireEvent.submit(screen.getByRole('form', { name: 'Filtros del catálogo' }));

    await waitFor(() => {
      expect(screen.queryAllByText('Taller de tecnología')).toHaveLength(0);
    });
    expect(screen.getAllByText('Feria de empleo')).not.toHaveLength(0);
  });

  it('filtra usando el mes local visible en un cruce de mes UTC', async () => {
    const monthBoundaryEvent = {
      ...catalogEvents[0],
      startDate: new Date('2026-10-31T23:59:00').toISOString(),
      endDate: new Date('2026-11-01T00:01:00').toISOString(),
    };
    jest.mocked(getEventCatalog).mockResolvedValueOnce([monthBoundaryEvent]);
    render(<EventsCatalogPage />);
    await screen.findAllByText('Feria de empleo');

    fireEvent.change(screen.getByLabelText('Filtrar por mes'), {
      target: { value: getEventMonthKey(monthBoundaryEvent.startDate) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getAllByText('Feria de empleo')).not.toHaveLength(0);
  });

  it('pluraliza el contador para cero, uno y varios resultados', async () => {
    const { rerender } = render(<EventsCatalogPage />);

    expect(await screen.findByText('2 eventos disponibles · 0 no disponibles')).toBeInTheDocument();

    jest.mocked(getEventCatalog).mockResolvedValueOnce([catalogEvents[0]]);
    rerender(<EventsCatalogPage key="one" />);
    expect(await screen.findByText('1 evento disponible · 0 no disponibles')).toBeInTheDocument();

    jest.mocked(getEventCatalog).mockResolvedValueOnce([]);
    rerender(<EventsCatalogPage key="zero" />);
    expect(await screen.findByText('0 eventos disponibles · 0 no disponibles')).toBeInTheDocument();
  });

  it('muestra el estado global cuando no existen eventos publicados', async () => {
    jest.mocked(getEventCatalog).mockResolvedValueOnce([]);
    render(<EventsCatalogPage />);

    expect(await screen.findByText('0 eventos disponibles · 0 no disponibles')).toBeInTheDocument();
    expect(screen.getByText(
      'El catálogo estará disponible cuando existan eventos publicados.',
    )).toBeInTheDocument();
  });

  it('permite mantener los enlaces de detalle dentro del portal', async () => {
    render(<PortalEventsCatalogPage detailBasePath="/portal/eventos" />);

    await screen.findAllByText('Feria de empleo');

    expect(screen.getAllByRole('link', { name: 'Ver detalle' })[0])
      .toHaveAttribute('href', '/portal/eventos/event-october');
  });

  it('distingue una búsqueda sin coincidencias de un catálogo vacío', async () => {
    render(<EventsCatalogPage />);
    await screen.findByText('2 eventos disponibles · 0 no disponibles');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar eventos' }), {
      target: { value: 'sin coincidencias' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByText('0 eventos disponibles · 0 no disponibles')).toBeInTheDocument();
    expect(screen.getByText(
      'No hay coincidencias con los filtros actuales. Modifica la búsqueda o el mes seleccionado.',
    )).toBeInTheDocument();
    expect(screen.queryByText(
      'El catálogo estará disponible cuando existan eventos publicados.',
    )).not.toBeInTheDocument();
  });

  it('recupera las pestañas del catálogo sin inventar rutas de HU9 o HU10', async () => {
    render(<EventsCatalogPage />);

    await screen.findAllByText('Feria de empleo');

    expect(screen.getByRole('button', { name: 'Explorar' }))
      .toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Mis eventos' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mis pases' })).toBeDisabled();
  });

  it('distingue eventos publicados, sin cupos y cancelados', async () => {
    jest.mocked(getEventCatalog).mockResolvedValueOnce([
      catalogEvents[0],
      { ...catalogEvents[1], currentCapacity: catalogEvents[1].maxCapacity },
      {
        ...catalogEvents[0],
        id: 'event-cancelled',
        title: 'Evento cancelado',
        status: EVENT_STATUS.CANCELADO,
      },
    ]);

    render(<EventsCatalogPage />);

    expect(await screen.findByText('1 evento disponible · 2 no disponibles'))
      .toBeInTheDocument();
    expect(screen.getByText('PUBLICADO')).toBeInTheDocument();
    expect(screen.getByText('SIN CUPOS')).toBeInTheDocument();
    expect(screen.getByText('CANCELADO')).toBeInTheDocument();
  });
});
