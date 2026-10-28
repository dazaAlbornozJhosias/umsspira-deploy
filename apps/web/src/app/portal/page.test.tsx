import { render, screen } from '@testing-library/react';
import { EVENT_STATUS, type EventItem } from '@umsspira/shared-types';

import Home from './page';
import { getEventCatalog } from '@/shared/services/events-service';

jest.mock('@/shared/services/events-service', () => ({
  getEventCatalog: jest.fn(),
}));

const publishedEvents: EventItem[] = [
  {
    id: 'event-published-1',
    title: 'Encuentro de titulados publicado',
    description: 'Evento real',
    startDate: '2026-11-15T14:00:00Z',
    endDate: '2026-11-15T17:00:00Z',
    maxCapacity: 50,
    location: 'Campus Central',
    imageUrl: 'https://cdn.example.test/eventos/encuentro.webp',
    status: EVENT_STATUS.PUBLICADO,
    createdBy: 'admin-1',
    createdAt: '2026-10-02T10:00:00Z',
  },
];

describe('portal home upcoming events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getEventCatalog).mockResolvedValue(publishedEvents);
  });

  it('loads published events from the shared catalog and links to their portal details', async () => {
    render(<Home />);

    expect(
      await screen.findByRole('link', { name: /Encuentro de titulados publicado/ }),
    ).toHaveAttribute('href', '/portal/eventos/event-published-1');
    expect(
      screen.getByRole('img', {
        name: 'Imagen del evento Encuentro de titulados publicado',
      }),
    ).toHaveAttribute('src', 'https://cdn.example.test/eventos/encuentro.webp');
    expect(screen.getByText('Campus Central')).toBeInTheDocument();
    expect(screen.getByText(/10:00.*1:00/)).toBeInTheDocument();
    expect(getEventCatalog).toHaveBeenCalledTimes(1);
  });

  it('muestra un respaldo visual cuando un evento no tiene imagen', async () => {
    jest.mocked(getEventCatalog).mockResolvedValueOnce([
      { ...publishedEvents[0], imageUrl: null },
    ]);

    render(<Home />);

    expect(
      await screen.findByRole('img', {
        name: 'Imagen no disponible para Encuentro de titulados publicado',
      }),
    ).toBeInTheDocument();
  });
});
