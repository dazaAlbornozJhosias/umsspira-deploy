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

import AdminEventDetailPage from '@/app/(dashboard)/events/[id]/page';
import { AuthenticatedUserProvider } from '@/modules/auth/frontend/components/authenticated-user-context';
import { EventDraftEditor } from '@/shared/components/event-draft-editor';
import {
  EventDraftsContent,
  EventInactiveContent,
  EventManagementContent,
} from '@/shared/components/events-ui';
import {
  formatEventDateTime,
  formatEventSchedule,
  getEventMonthKey,
} from '@/shared/utils/event-date-time';

const mockPush = jest.fn();
const mockGetAdminEvents = jest.fn();
const mockGetAdminEvent = jest.fn();
const mockGetAdminDraft = jest.fn();
const mockUpdateDraftEvent = jest.fn();
const mockPublishDraftEvent = jest.fn();
const mockGetInactiveEvents = jest.fn();
const mockRetireEvent = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/events',
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'draft-1' }),
}));

jest.mock('@/shared/services/events-service', () => ({
  getAdminEvents: (...args: unknown[]) => mockGetAdminEvents(...args),
  getAdminEvent: (...args: unknown[]) => mockGetAdminEvent(...args),
  getAdminDraft: (...args: unknown[]) => mockGetAdminDraft(...args),
  updateDraftEvent: (...args: unknown[]) => mockUpdateDraftEvent(...args),
  publishDraftEvent: (...args: unknown[]) => mockPublishDraftEvent(...args),
  getInactiveEvents: (...args: unknown[]) => mockGetInactiveEvents(...args),
  retireEvent: (...args: unknown[]) => mockRetireEvent(...args),
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

const cancelledEvent: EventItem = {
  ...draftEvent,
  id: 'cancelled-1',
  title: 'Encuentro cancelado',
  status: EVENT_STATUS.CANCELADO,
  startDate: '2026-11-03T14:00:00',
};

describe('Gestión administrativa de eventos HU1', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockGetAdminEvents.mockReset();
    mockGetAdminDraft.mockReset();
    mockUpdateDraftEvent.mockReset();
    mockPublishDraftEvent.mockReset();
    mockGetAdminEvent.mockReset();
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

  it('muestra el nombre del creador y la fecha de creación sin exponer su UUID', async () => {
    mockGetAdminEvents.mockResolvedValueOnce([
      { ...publishedEvent, creatorName: 'Dirección de Sistemas' },
    ]);

    render(<EventManagementContent userId="user-1" />);

    expect(
      await screen.findByText((_, element) =>
        element?.tagName === 'SMALL' &&
        element.textContent?.includes('Creado por Dirección de Sistemas'),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText((_, element) =>
      element?.tagName === 'SMALL' && element.textContent?.includes('Creado el'),
    )).toBeInTheDocument();
    expect(screen.queryByText(/78869fe3-/)).not.toBeInTheDocument();
  });

  it('abre la vista de detalle al pulsar Ver en un evento publicado', async () => {
    mockGetAdminEvents.mockResolvedValueOnce([publishedEvent]);

    render(<EventManagementContent userId="user-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /ver/i }));

    expect(mockPush).toHaveBeenCalledWith('/events/published-1');
  });

  it('no muestra un affordance de menú sin acciones autorizadas', async () => {
    mockGetAdminEvents.mockResolvedValueOnce([publishedEvent]);

    render(<EventManagementContent userId="user-1" />);

    const viewButton = await screen.findByRole('button', { name: /ver/i });
    expect(viewButton.parentElement?.querySelectorAll('svg')).toHaveLength(1);
  });

  it('filtra los eventos por estado y mes elegidos', async () => {
    mockGetAdminEvents.mockResolvedValueOnce([
      publishedEvent,
      draftEvent,
      cancelledEvent,
    ]);

    render(<EventManagementContent userId="user-1" />);
    await screen.findByText('Encuentro cancelado');

    fireEvent.change(screen.getByLabelText('Estado'), {
      target: { value: EVENT_STATUS.BORRADOR },
    });
    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: '2026-10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(screen.getByText('Taller Real de Ciberseguridad')).toBeInTheDocument();
    expect(screen.queryByText('Feria de Empleo Real')).not.toBeInTheDocument();
    expect(screen.queryByText('Encuentro cancelado')).not.toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 3 eventos')).toBeInTheDocument();
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

  it('distingue filtros sin coincidencias de un listado realmente vacío', async () => {
    mockGetAdminEvents.mockResolvedValueOnce([publishedEvent]);

    render(<EventManagementContent userId="user-1" />);
    await screen.findByText('Feria de Empleo Real');
    fireEvent.change(screen.getByLabelText('Buscar'), {
      target: { value: 'sin coincidencias' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(
      screen.getByText('No se encontraron eventos que coincidan con los filtros.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No hay eventos registrados.')).not.toBeInTheDocument();
  });

  it('filtra por el mes local que se muestra al administrador', async () => {
    const localMonthBoundaryEvent = {
      ...publishedEvent,
      startDate: new Date('2026-10-31T23:59:00').toISOString(),
      endDate: new Date('2026-11-01T00:01:00').toISOString(),
    };
    const visibleMonth = getEventMonthKey(localMonthBoundaryEvent.startDate);
    mockGetAdminEvents.mockResolvedValueOnce([localMonthBoundaryEvent]);

    render(<EventManagementContent userId="user-1" />);
    await screen.findByText('Feria de Empleo Real');
    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: visibleMonth },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(screen.getByText('Feria de Empleo Real')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 1 eventos')).toBeInTheDocument();
  });

  it('muestra inicio y fin en Gestión para un evento de varios días', async () => {
    const multidayEvent = {
      ...publishedEvent,
      startDate: new Date('2026-10-31T23:59:00').toISOString(),
      endDate: new Date('2026-11-01T00:01:00').toISOString(),
    };
    mockGetAdminEvents.mockResolvedValueOnce([multidayEvent]);

    render(<EventManagementContent userId="user-1" />);

    expect(
      await screen.findByText(
        formatEventSchedule(multidayEvent.startDate, multidayEvent.endDate),
      ),
    ).toBeInTheDocument();
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
    expect(mockPublishDraftEvent).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Ver evento' })).toHaveAttribute(
      'href',
      '/events/draft-1',
    );
    expect(screen.getByText('0 borradores')).toBeInTheDocument();
  });

  it('muestra el rango multiday completo en Borradores y su confirmación', async () => {
    const multidayDraft = {
      ...draftEvent,
      startDate: new Date('2026-10-31T23:59:00').toISOString(),
      endDate: new Date('2026-11-01T00:01:00').toISOString(),
    };
    const expectedSchedule = formatEventSchedule(
      multidayDraft.startDate,
      multidayDraft.endDate,
    );
    mockGetAdminEvents.mockResolvedValueOnce([multidayDraft]);

    render(<EventDraftsContent userId="user-1" />);

    expect(await screen.findByText(expectedSchedule)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(
      within(screen.getByRole('dialog')).getByText(expectedSchedule),
    ).toBeInTheDocument();
  });

  it('muestra el error real de la consulta administrativa', async () => {
    mockGetAdminEvents.mockRejectedValueOnce(new Error('Consulta administrativa fallida.'));

    render(<EventDraftsContent userId="user-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Consulta administrativa fallida.',
    );
  });
});

describe('Detalle administrativo de evento HU1', () => {
  it('muestra fecha y hora de inicio y fin de un evento multiday', async () => {
    const multidayEvent = {
      ...publishedEvent,
      startDate: new Date('2026-10-31T23:59:00').toISOString(),
      endDate: new Date('2026-11-01T00:01:00').toISOString(),
    };
    mockGetAdminEvent.mockResolvedValueOnce(multidayEvent);

    render(
      <AuthenticatedUserProvider userId="admin-1" role="administrador">
        <AdminEventDetailPage />
      </AuthenticatedUserProvider>,
    );

    expect(
      await screen.findByText(formatEventDateTime(multidayEvent.startDate)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatEventDateTime(multidayEvent.endDate)),
    ).toBeInTheDocument();
  });
});

describe('Edición de borrador HU1', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockGetAdminDraft.mockReset();
    mockUpdateDraftEvent.mockReset();
  });

  it('precarga EventForm y actualiza el mismo id manteniendo el flujo de borrador', async () => {    mockGetAdminDraft.mockResolvedValueOnce(draftEvent);
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

  it('valida inmediatamente al editar y no actualiza un borrador inválido', async () => {
    mockGetAdminDraft.mockResolvedValueOnce(draftEvent);

    render(<EventDraftEditor eventId="draft-1" userId="user-1" />);

    const titleInput = await screen.findByDisplayValue('Taller Real de Ciberseguridad');
    fireEvent.change(titleInput, { target: { value: '' } });

    expect(screen.getByText('Este campo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('1 campo por revisar')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Guardar borrador' })[0]);
    expect(mockUpdateDraftEvent).not.toHaveBeenCalled();
  });

  it('muestra el error de carga y no presenta un formulario vacío', async () => {
    mockGetAdminDraft.mockRejectedValueOnce(new Error('Borrador no encontrado.'));

    render(<EventDraftEditor eventId="draft-1" userId="user-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Borrador no encontrado.');
    expect(screen.queryByPlaceholderText('Ej. Feria de Oportunidades UMSS')).not.toBeInTheDocument();
  });
});

const inactiveWithHistory = {
  ...draftEvent,
  id: 'inactive-1',
  title: 'Feria cancelada con historial',
  status: EVENT_STATUS.CANCELADO,
  inactiveStatus: 'CANCELADO' as const,
  registrationsCount: 3,
  passesCount: 2,
};

const inactiveWithoutHistory = {
  ...draftEvent,
  id: 'inactive-2',
  title: 'Encuentro finalizado sin historial',
  status: EVENT_STATUS.PUBLICADO,
  startDate: '2025-11-03T14:00:00',
  endDate: '2025-11-03T16:00:00',
  inactiveStatus: 'FINALIZADO' as const,
  registrationsCount: 0,
  passesCount: 0,
};

describe('Eventos inactivos HU7', () => {
  beforeEach(() => {
    mockGetInactiveEvents.mockReset();
    mockRetireEvent.mockReset();
  });

  it('lista solo los eventos inactivos con su estado y conteos', async () => {
    mockGetInactiveEvents.mockResolvedValueOnce([
      inactiveWithHistory,
      inactiveWithoutHistory,
    ]);

    render(<EventInactiveContent userId="user-1" />);

    expect(
      await screen.findByText('Feria cancelada con historial'),
    ).toBeInTheDocument();
    expect(screen.getByText('Encuentro finalizado sin historial')).toBeInTheDocument();
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
    expect(screen.getByText('Finalizado')).toBeInTheDocument();
    expect(screen.getByText('3 inscripciones · 2 pases')).toBeInTheDocument();
    expect(screen.getByText('0 inscripciones · 0 pases')).toBeInTheDocument();
    expect(mockGetInactiveEvents).toHaveBeenCalledWith('user-1');
  });

  it('muestra el aviso de archivado cuando hay historial', async () => {
    mockGetInactiveEvents.mockResolvedValueOnce([inactiveWithHistory]);

    render(<EventInactiveContent userId="user-1" />);

    await screen.findByText('Feria cancelada con historial');
    fireEvent.click(screen.getByRole('button', { name: /retirar/i }));

    const dialog = screen.getByRole('dialog', { name: '¿Retirar este evento?' });
    expect(within(dialog).getByText(/se archivará para preservar el historial/i)).toBeInTheDocument();
  });

  it('retira el evento, lo quita del listado y muestra la confirmación', async () => {
    mockGetInactiveEvents.mockResolvedValueOnce([inactiveWithHistory]);
    mockRetireEvent.mockResolvedValueOnce({
      id: 'inactive-1',
      registrationsCount: 3,
      passesCount: 2,
    });

    render(<EventInactiveContent userId="user-1" />);

    await screen.findByText('Feria cancelada con historial');
    fireEvent.click(screen.getByRole('button', { name: /retirar/i }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: '¿Retirar este evento?' }))
        .getByRole('button', { name: 'Retirar evento' }),
    );

    expect(await screen.findByText('¡Evento retirado correctamente!')).toBeInTheDocument();
    expect(mockRetireEvent).toHaveBeenCalledWith('inactive-1', 'user-1');
    expect(screen.queryByText('Feria cancelada con historial')).not.toBeInTheDocument();
    expect(screen.getByText('0 eventos inactivos')).toBeInTheDocument();
  });

  it('no retira si se cancela el diálogo', async () => {
    mockGetInactiveEvents.mockResolvedValueOnce([inactiveWithHistory]);

    render(<EventInactiveContent userId="user-1" />);

    await screen.findByText('Feria cancelada con historial');
    fireEvent.click(screen.getByRole('button', { name: /retirar/i }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    );

    expect(mockRetireEvent).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Feria cancelada con historial')).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay eventos inactivos', async () => {
    mockGetInactiveEvents.mockResolvedValueOnce([]);

    render(<EventInactiveContent userId="user-1" />);

    expect(
      await screen.findByText('No hay eventos cancelados o finalizados por retirar.'),
    ).toBeInTheDocument();
  });

  it('muestra el error de la consulta y bloquea sin identidad', async () => {
    mockGetInactiveEvents.mockRejectedValueOnce(new Error('Fallo al cargar inactivos.'));

    render(<EventInactiveContent userId="user-1" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo al cargar inactivos.');
  });

  it('no consulta inactivos sin usuario autenticado', async () => {
    render(<EventInactiveContent />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay un usuario autenticado disponible para consultar los eventos.',
    );
    expect(mockGetInactiveEvents).not.toHaveBeenCalled();
  });
});
