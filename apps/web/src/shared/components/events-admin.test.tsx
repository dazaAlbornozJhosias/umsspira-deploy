import '@testing-library/jest-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  EVENT_STATUS,
  type EventItem,
} from '@umsspira/shared-types';

import { EventDraftEditor } from '@/shared/components/event-draft-editor';
import {
  EventDraftsContent,
  EventManagementContent,
} from '@/shared/components/events-ui';

const mockPush = jest.fn();
const mockGetAdminEvents = jest.fn();
const mockGetAdminDraft = jest.fn();
const mockUpdateDraftEvent = jest.fn();
const mockPublishDraftEvent = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/events',
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'draft-1' }),
}));

jest.mock('@/shared/services/events-service', () => ({
  getAdminEvents: (...args: unknown[]) => mockGetAdminEvents(...args),
  getAdminDraft: (...args: unknown[]) => mockGetAdminDraft(...args),
  updateDraftEvent: (...args: unknown[]) => mockUpdateDraftEvent(...args),
  publishDraftEvent: (...args: unknown[]) => mockPublishDraftEvent(...args),
}));

const publishedEvent: EventItem = {
  id: 'published-1',
  title: 'Feria de Empleo Real',
  description: 'Evento publicado',
  startDate: '2026-10-12T09:00:00',
  endDate: '2026-10-12T17:00:00',
  maxCapacity: 180,
  location: 'Campus Central',
  status: EVENT_STATUS.PUBLICADO,
  createdBy: 'user-1',
  createdAt: '2026-09-26T12:00:00Z',
};

const draftEvent: EventItem = {
  id: 'draft-1',
  title: 'Taller Real de Ciberseguridad',
  description: 'Borrador administrativo',
  startDate: '2026-10-18T14:00:00',
  endDate: '2026-10-18T17:00:00',
  maxCapacity: 40,
  location: 'Laboratorio 3',
  status: EVENT_STATUS.BORRADOR,
  createdBy: 'user-1',
  createdAt: '2026-09-25T12:00:00Z',
};

describe('Gestión administrativa de eventos HU1', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockGetAdminEvents.mockReset();
    mockGetAdminDraft.mockReset();
    mockUpdateDraftEvent.mockReset();
    mockPublishDraftEvent.mockReset();
  });

  it('deriva las métricas y renderiza únicamente los eventos recibidos', async () => {
    mockGetAdminEvents.mockResolvedValueOnce([
      publishedEvent,
      draftEvent,
      { ...draftEvent, id: 'draft-2', title: 'Segundo borrador real' },
    ]);

    render(<EventManagementContent userId="user-1" />);

    expect(await screen.findByText('Feria de Empleo Real')).toBeInTheDocument();
    expect(screen.getByText('Taller Real de Ciberseguridad')).toBeInTheDocument();
    const metrics = screen.getByLabelText('Resumen de eventos');
    expect(within(metrics).getByText('3')).toBeInTheDocument();
    expect(within(metrics).getByText('1')).toBeInTheDocument();
    expect(within(metrics).getByText('2')).toBeInTheDocument();
    expect(mockGetAdminEvents).toHaveBeenCalledWith('user-1');
  });

  it('muestra el bloqueo de identidad y no consulta datos', async () => {
    render(<EventManagementContent />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay un usuario autenticado disponible para consultar los eventos.',
    );
    expect(mockGetAdminEvents).not.toHaveBeenCalled();
  });

  it('muestra un estado vacío real cuando la API devuelve cero eventos', async () => {
    mockGetAdminEvents.mockResolvedValueOnce([]);

    render(<EventManagementContent userId="user-1" />);

    expect(await screen.findByText('No hay eventos registrados.')).toBeInTheDocument();
    expect(screen.queryByText('Feria de Empleo Real')).not.toBeInTheDocument();
  });

  it('muestra únicamente borradores y enlaza Continuar edición al mismo id', async () => {
    mockGetAdminEvents.mockResolvedValueOnce([publishedEvent, draftEvent]);

    render(<EventDraftsContent userId="user-1" />);

    expect(await screen.findByText('1 borrador')).toBeInTheDocument();
    expect(screen.getByText('Taller Real de Ciberseguridad')).toBeInTheDocument();
    expect(screen.queryByText('Feria de Empleo Real')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuar edición' })).toHaveAttribute(
      'href',
      '/events/drafts/draft-1',
    );
  });

  it('cancela la confirmación sin publicar y luego publica el mismo borrador', async () => {
    mockGetAdminEvents.mockResolvedValueOnce([draftEvent]);
    mockPublishDraftEvent.mockResolvedValueOnce({
      ...draftEvent,
      status: EVENT_STATUS.PUBLICADO,
    });

    render(<EventDraftsContent userId="user-1" />);

    await screen.findByText('Taller Real de Ciberseguridad');
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    const firstDialog = screen.getByRole('dialog', { name: '¿Publicar este evento?' });
    fireEvent.click(within(firstDialog).getByRole('button', { name: 'Cancelar' }));

    expect(mockPublishDraftEvent).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: '¿Publicar este evento?' }))
        .getByRole('button', { name: 'Publicar evento' }),
    );

    expect(await screen.findByText('¡Evento publicado correctamente!')).toBeInTheDocument();
    expect(mockPublishDraftEvent).toHaveBeenCalledWith('draft-1', 'user-1');
    expect(screen.getByText('0 borradores')).toBeInTheDocument();
  });

  it('muestra el error real de la consulta administrativa', async () => {
    mockGetAdminEvents.mockRejectedValueOnce(new Error('Consulta administrativa fallida.'));

    render(<EventDraftsContent userId="user-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Consulta administrativa fallida.',
    );
  });
});

describe('Edición de borrador HU1', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockGetAdminDraft.mockReset();
    mockUpdateDraftEvent.mockReset();
  });

  it('precarga EventForm y actualiza el mismo id manteniendo el flujo de borrador', async () => {
    mockGetAdminDraft.mockResolvedValueOnce(draftEvent);
    mockUpdateDraftEvent.mockImplementationOnce(
      (_eventId: string, changes: object) => Promise.resolve({
        ...draftEvent,
        ...changes,
      }),
    );

    render(<EventDraftEditor eventId="draft-1" userId="user-1" />);

    const titleInput = await screen.findByDisplayValue('Taller Real de Ciberseguridad');
    expect(screen.getByDisplayValue('Borrador administrativo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();

    fireEvent.change(titleInput, {
      target: { value: 'Taller Real Actualizado' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Guardar borrador' })[0]);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Cambios del borrador guardados correctamente.',
    );
    expect(mockUpdateDraftEvent).toHaveBeenCalledWith(
      'draft-1',
      expect.objectContaining({
        title: 'Taller Real Actualizado',
      }),
      'user-1',
    );
    expect(mockUpdateDraftEvent.mock.calls[0][1]).not.toHaveProperty('status');
  });

  it('muestra el error de carga y no presenta un formulario vacío', async () => {
    mockGetAdminDraft.mockRejectedValueOnce(new Error('Borrador no encontrado.'));

    render(<EventDraftEditor eventId="draft-1" userId="user-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Borrador no encontrado.');
    expect(screen.queryByPlaceholderText('Ej. Feria de Oportunidades UMSS')).not.toBeInTheDocument();
  });
});
