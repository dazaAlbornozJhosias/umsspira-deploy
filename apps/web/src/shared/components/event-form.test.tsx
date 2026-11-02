import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  EVENT_MAX_CAPACITY,
  EVENT_STATUS,
  type EventItem,
} from '@umsspira/shared-types';

import CreateEventPage from '@/app/(dashboard)/events/create/page';
import { AuthenticatedUserProvider } from '@/modules/auth/frontend/components/authenticated-user-context';
import EventForm from '@/shared/components/event-form';
import { isEventInputDateValid } from '@/shared/utils/event-date-time';

const TEST_USER_ID = '78869fe3-9744-41f6-a29e-fcf16e43c222';
const mockPush = jest.fn();
const mockCreateEvent = jest.fn();

function toBoliviaIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-04:00`).toISOString();
}

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: jest.fn(() => 'blob:test-cover'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: jest.fn(),
  });
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/events/create',
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/shared/services/events-service', () => ({
  createEvent: (...args: unknown[]) => mockCreateEvent(...args),
}));

function renderCreateEventPage() {
  return render(
    <AuthenticatedUserProvider userId={TEST_USER_ID}>
      <CreateEventPage />
    </AuthenticatedUserProvider>,
  );
}

function fillValidForm(
  container: HTMLElement,
  overrides: {
    title?: string;
    capacity?: string;
    location?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
  } = {},
) {
  fireEvent.change(screen.getByPlaceholderText('Ej. Feria de Oportunidades UMSS'), {
    target: { value: overrides.title ?? 'Feria tecnológica' },
  });

  const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]');
  const timeInputs = container.querySelectorAll<HTMLInputElement>('input[type="time"]');

  fireEvent.change(dateInputs[0], {
    target: { value: overrides.startDate ?? '2026-10-12' },
  });
  fireEvent.change(timeInputs[0], {
    target: { value: overrides.startTime ?? '09:00' },
  });
  fireEvent.change(dateInputs[1], {
    target: { value: overrides.endDate ?? '2026-10-12' },
  });
  fireEvent.change(timeInputs[1], {
    target: { value: overrides.endTime ?? '17:00' },
  });
  fireEvent.change(screen.getByPlaceholderText('Ej. 150'), {
    target: { value: overrides.capacity ?? '50' },
  });
  if (overrides.location !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('Ej. Auditorio Central UMSS'), {
      target: { value: overrides.location },
    });
  }
}

function clickDesktopDraftButton() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Guardar borrador' })[0]);
}

describe('EventForm HU1', () => {
  it('no muestra errores antes de que el usuario interactúe', () => {
    render(<EventForm onSubmit={jest.fn()} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/campos? por revisar/)).not.toBeInTheDocument();
  });

  it('muestra inmediatamente el error al tocar y dejar vacío un obligatorio', () => {
    render(<EventForm onSubmit={jest.fn()} />);
    const titleInput = screen.getByPlaceholderText('Ej. Feria de Oportunidades UMSS');

    fireEvent.focus(titleInput);
    fireEvent.blur(titleInput);

    expect(screen.getByText('Este campo es obligatorio.')).toBeInTheDocument();
    expect(screen.getByText('1 campo por revisar')).toBeInTheDocument();
  });

  it('bloquea el formulario vacío sin ejecutar onSubmit', () => {
    const onSubmit = jest.fn();
    render(<EventForm onSubmit={onSubmit} />);

    clickDesktopDraftButton();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('6 campos por revisar')).toBeInTheDocument();
  });

  it('reduce inmediatamente el contador por cada control corregido', () => {
    const { container } = render(<EventForm onSubmit={jest.fn()} />);
    const titleInput = screen.getByPlaceholderText('Ej. Feria de Oportunidades UMSS');
    const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]');
    const timeInputs = container.querySelectorAll<HTMLInputElement>('input[type="time"]');
    const capacityInput = screen.getByPlaceholderText('Ej. 150');

    clickDesktopDraftButton();
    expect(screen.getByText('6 campos por revisar')).toBeInTheDocument();

    fireEvent.change(titleInput, { target: { value: 'Evento válido' } });
    expect(screen.getByText('5 campos por revisar')).toBeInTheDocument();
    fireEvent.change(dateInputs[0], { target: { value: '2026-10-12' } });
    expect(screen.getByText('4 campos por revisar')).toBeInTheDocument();
    fireEvent.change(timeInputs[0], { target: { value: '09:00' } });
    expect(screen.getByText('3 campos por revisar')).toBeInTheDocument();
    fireEvent.change(dateInputs[1], { target: { value: '2026-10-12' } });
    expect(screen.getByText('2 campos por revisar')).toBeInTheDocument();
    fireEvent.change(timeInputs[1], { target: { value: '17:00' } });
    expect(screen.getByText('1 campo por revisar')).toBeInTheDocument();
    fireEvent.change(capacityInput, { target: { value: '1' } });

    expect(screen.queryByText(/campos? por revisar/)).not.toBeInTheDocument();
  });

  it.each([
    '0',
    '-1',
    '1.5',
    'E12',
    '1e2',
    String(EVENT_MAX_CAPACITY + 1),
  ])('rechaza el cupo inválido %s', (capacity) => {
    const onSubmit = jest.fn();
    const { container } = render(<EventForm onSubmit={onSubmit} />);

    fillValidForm(container, { capacity });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'El cupo máximo debe ser un número entero entre 1 y 10000.',
      ),
    ).toBeInTheDocument();
  });

  it('rechaza un título numérico antes de abrir el modal o enviar', () => {
    const onSubmit = jest.fn();
    const { container } = render(<EventForm onSubmit={onSubmit} />);

    fillValidForm(container, { title: '100000' });

    expect(
      screen.getByText('El título debe contener al menos una letra.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publicar evento' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('acepta 45 caracteres y avisa inmediatamente al intentar superarlos', () => {
    render(<EventForm onSubmit={jest.fn()} />);
    const input = screen.getByPlaceholderText('Ej. Feria de Oportunidades UMSS');

    fireEvent.change(input, { target: { value: 'A'.repeat(45) } });
    expect(input).toHaveValue('A'.repeat(45));
    expect(screen.queryByText(/título no puede superar/)).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'A'.repeat(46) } });
    expect(input).toHaveValue('A'.repeat(46));
    expect(
      screen.getByText('El título no puede superar los 45 caracteres.'),
    ).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Título corregido' } });
    expect(screen.queryByText(/título no puede superar/)).not.toBeInTheDocument();
  });

  it('acepta 100 caracteres y avisa inmediatamente al superar ubicación', () => {
    render(<EventForm onSubmit={jest.fn()} />);
    const locationInput = screen.getByPlaceholderText('Ej. Auditorio Central UMSS');

    fireEvent.change(locationInput, { target: { value: 'A'.repeat(100) } });
    expect(screen.queryByText(/ubicación no puede superar/)).not.toBeInTheDocument();

    fireEvent.change(locationInput, { target: { value: 'A'.repeat(101) } });
    expect(locationInput).toHaveValue('A'.repeat(101));
    expect(
      screen.getByText('La ubicación no puede superar los 100 caracteres.'),
    ).toBeInTheDocument();

    fireEvent.change(locationInput, { target: { value: 'A'.repeat(100) } });
    expect(screen.queryByText(/ubicación no puede superar/)).not.toBeInTheDocument();
  });

  it.each([
    ['1900-01-01', true],
    ['2100-12-31', true],
    ['1899-12-31', false],
    ['2101-01-01', false],
    ['275760-01-01', false],
    ['2026-10-12', true],
  ])('valida la fecha técnica %s', (date, expected) => {
    expect(isEventInputDateValid(date)).toBe(expected);
  });

  it('muestra inmediatamente una fecha fuera del rango permitido', () => {
    const { container } = render(<EventForm onSubmit={jest.fn()} />);
    const startDateInput = container.querySelectorAll<HTMLInputElement>('input[type="date"]')[0];

    fireEvent.change(startDateInput, { target: { value: '1899-12-31' } });

    expect(
      screen.getByText('Ingresa una fecha válida entre 1900 y 2100.'),
    ).toBeInTheDocument();
  });

  it('expone los límites técnicos en ambos inputs de fecha', () => {
    const { container } = render(<EventForm onSubmit={jest.fn()} />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type=date]');

    expect(dateInputs).toHaveLength(2);
    dateInputs.forEach((input) => {
      expect(input).toHaveAttribute('min', '1900-01-01');
      expect(input).toHaveAttribute('max', '2100-12-31');
    });
  });

  it.each(['1', '40', String(EVENT_MAX_CAPACITY)])(
    'acepta el cupo almacenable %s',
    async (capacity) => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const { container } = render(<EventForm onSubmit={onSubmit} />);

      fillValidForm(container, { capacity });
      clickDesktopDraftButton();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ maxCapacity: Number(capacity) }),
          null,
        );
      });
    },
  );

  it.each([
    ['1', 'Cupo máximo · 1 persona'],
    ['2', 'Cupo máximo · 2 personas'],
    [String(EVENT_MAX_CAPACITY), 'Cupo máximo · 10000 personas'],
  ])('pluraliza el cupo %s en Crear', (capacity, expectedText) => {
    render(<EventForm onSubmit={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Ej. 150'), {
      target: { value: capacity },
    });

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it('rechaza una fecha final anterior al inicio', () => {
    const onSubmit = jest.fn();
    const { container } = render(<EventForm onSubmit={onSubmit} />);

    fillValidForm(container, { endDate: '2026-10-11' });

    expect(screen.getAllByText('Debe ser posterior al inicio.')).toHaveLength(2);

    clickDesktopDraftButton();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía BORRADOR, conserva el archivo y muestra loading', async () => {
    let finishRequest: (() => void) | undefined;
    const request = new Promise<void>((resolve) => {
      finishRequest = resolve;
    });
    const onSubmit = jest.fn(() => request);
    const { container } = render(<EventForm onSubmit={onSubmit} />);
    const image = new File(['portada'], 'portada.png', { type: 'image/png' });

    fillValidForm(container);
    fireEvent.change(container.querySelector('#event-image') as HTMLInputElement, {
      target: { files: [image] },
    });
    clickDesktopDraftButton();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: toBoliviaIso('2026-10-12', '09:00'),
          endDate: toBoliviaIso('2026-10-12', '17:00'),
          status: EVENT_STATUS.BORRADOR,
        }),
        image,
      );
    });
    expect(screen.getAllByText('Guardando…')).toHaveLength(2);

    await act(async () => finishRequest?.());
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Guardar borrador' })[0]).toBeEnabled();
    });
  });

  it('abre confirmación sin enviar y Cancelar conserva los datos', () => {
    const onSubmit = jest.fn();
    const { container } = render(<EventForm onSubmit={onSubmit} />);

    fillValidForm(container);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar evento' }));

    const dialog = screen.getByRole('dialog', { name: '¿Publicar este evento?' });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej. Feria de Oportunidades UMSS')).toHaveValue('Feria tecnológica');
  });

  it('confirma el modal enviando PUBLICADO', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { container } = render(<EventForm onSubmit={onSubmit} />);

    fillValidForm(container);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar evento' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Publicar evento' }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: EVENT_STATUS.PUBLICADO }),
        null,
      );
    });
  });

  it.each([
    ['mismo día', '2026-10-12', '09:00', '2026-10-12', '18:00'],
    ['varios días', '2026-11-01', '09:00', '2026-11-03', '18:00'],
    ['cruce de medianoche', '2026-10-20', '23:59', '2026-10-21', '00:01'],
    ['cambio de mes', '2026-10-31', '23:59', '2026-11-01', '00:01'],
  ])(
    'serializa una sola vez el horario local: %s',
    async (_caseName, startDate, startTime, endDate, endTime) => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const { container } = render(<EventForm onSubmit={onSubmit} />);

      fillValidForm(container, {
        startDate,
        startTime,
        endDate,
        endTime,
      });
      clickDesktopDraftButton();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: toBoliviaIso(startDate, startTime),
            endDate: toBoliviaIso(endDate, endTime),
          }),
          null,
        );
      });
    },
  );

  it('valida inmediatamente y pluraliza el cupo al Editar borrador', () => {
    const onSubmit = jest.fn();
    const initialEvent: EventItem = {
      id: 'draft-validation',
      title: 'Evento editable',
      description: null,
      startDate: toBoliviaIso('2026-11-01', '09:00'),
      endDate: toBoliviaIso('2026-11-01', '18:00'),
      maxCapacity: 1,
      location: null,
      status: EVENT_STATUS.BORRADOR,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
    };

    render(
      <EventForm
        initialEvent={initialEvent}
        onSubmit={onSubmit}
        allowPublication={false}
      />,
    );

    const titleInput = screen.getByDisplayValue('Evento editable');
    const capacityInput = screen.getByPlaceholderText('Ej. 150');
    expect(screen.getByText('Cupo máximo · 1 persona')).toBeInTheDocument();

    fireEvent.change(titleInput, { target: { value: '12345' } });
    expect(
      screen.getByText('El título debe contener al menos una letra.'),
    ).toBeInTheDocument();
    fireEvent.change(titleInput, { target: { value: 'Evento corregido' } });
    expect(screen.queryByText(/título debe contener/)).not.toBeInTheDocument();

    fireEvent.change(capacityInput, { target: { value: 'E12' } });
    expect(
      screen.getByText('El cupo máximo debe ser un número entero entre 1 y 10000.'),
    ).toBeInTheDocument();
    clickDesktopDraftButton();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(capacityInput, { target: { value: '2' } });
    expect(screen.getByText('Cupo máximo · 2 personas')).toBeInTheDocument();
    fireEvent.change(capacityInput, { target: { value: String(EVENT_MAX_CAPACITY) } });
    expect(screen.getByText('Cupo máximo · 10000 personas')).toBeInTheDocument();
    expect(screen.queryByText(/cupo máximo debe ser/)).not.toBeInTheDocument();
  });

  it('editar y guardar dos veces no acumula desplazamiento horario', async () => {
    const startDate = toBoliviaIso('2026-11-01', '09:00');
    const endDate = toBoliviaIso('2026-11-03', '18:00');
    const initialEvent: EventItem = {
      id: 'draft-roundtrip',
      title: 'Evento multiday',
      description: null,
      startDate,
      endDate,
      maxCapacity: 40,
      location: null,
      status: EVENT_STATUS.BORRADOR,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
    };
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <EventForm initialEvent={initialEvent} onSubmit={onSubmit} />,
    );

    clickDesktopDraftButton();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const firstSavedEvent = onSubmit.mock.calls[0][0];
    rerender(
      <EventForm
        initialEvent={{
          ...initialEvent,
          startDate: firstSavedEvent.startDate,
          endDate: firstSavedEvent.endDate,
        }}
        onSubmit={onSubmit}
      />,
    );
    await waitFor(() => {
      expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('18:00')).toBeInTheDocument();
    });

    clickDesktopDraftButton();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        startDate,
        endDate,
      }),
    );
  });

  it('muestra ambos extremos de un evento que cambia de mes', () => {
    const onSubmit = jest.fn();
    const { container } = render(<EventForm onSubmit={onSubmit} />);

    fillValidForm(container, {
      startDate: '2026-10-31',
      startTime: '23:59',
      endDate: '2026-11-01',
      endTime: '00:01',
    });

    expect(
      screen.getByText('31 oct 2026 · 23:59 / 01 nov 2026 · 00:01'),
    ).toBeInTheDocument();
  });
});

describe('CreateEventPage HU1', () => {
  beforeEach(() => {
    mockCreateEvent.mockReset();
    mockPush.mockReset();
  });

  it('Cancelar vuelve a /events sin guardar', () => {
    renderCreateEventPage();

    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);

    expect(mockCreateEvent).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/events');
  });

  it('muestra feedback después de guardar un borrador', async () => {
    mockCreateEvent.mockResolvedValueOnce({});
    const { container } = renderCreateEventPage();

    fillValidForm(container);
    clickDesktopDraftButton();

    expect(await screen.findByRole('status')).toHaveTextContent('Borrador guardado correctamente.');
    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: EVENT_STATUS.BORRADOR }),
      TEST_USER_ID,
    );
  });

  it('usa feedback neutral cuando Guardar borrador encuentra errores', () => {
    renderCreateEventPage();

    clickDesktopDraftButton();

    expect(
      screen.getByText('Corrige los campos marcados para continuar.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/antes de publicar/i)).not.toBeInTheDocument();
    expect(mockCreateEvent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Publicar evento' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockCreateEvent).not.toHaveBeenCalled();
  });

  it('muestra el error real devuelto por el servicio', async () => {
    mockCreateEvent.mockRejectedValueOnce(new Error('Se requiere una sesión autenticada.'));
    const { container } = renderCreateEventPage();

    fillValidForm(container);
    clickDesktopDraftButton();

    expect(await screen.findByRole('alert')).toHaveTextContent('Se requiere una sesión autenticada.');
  });

  it('muestra publicación exitosa y Volver a eventos navega a /events', async () => {
    mockCreateEvent.mockResolvedValueOnce({ id: 'created-event-1' });
    const { container } = renderCreateEventPage();

    fillValidForm(container);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar evento' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Publicar evento' }),
    );

    expect(await screen.findByText('¡Evento publicado correctamente!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver evento' })).toHaveAttribute(
      'href',
      '/events/created-event-1',
    );
    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: EVENT_STATUS.PUBLICADO }),
      TEST_USER_ID,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Volver a eventos' }));
    expect(mockPush).toHaveBeenCalledWith('/events');
  });
});
