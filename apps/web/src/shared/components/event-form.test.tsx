import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { EVENT_STATUS } from '@umsspira/shared-types';

import CreateEventPage from '@/app/(dashboard)/events/create/page';
import EventForm from '@/shared/components/event-form';

const mockPush = jest.fn();
const mockCreateEvent = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/events/create',
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/shared/services/events-service', () => ({
  createEvent: (...args: unknown[]) => mockCreateEvent(...args),
}));

function fillValidForm(
  container: HTMLElement,
  overrides: {
    capacity?: string;
    endDate?: string;
    endTime?: string;
  } = {},
) {
  fireEvent.change(screen.getByPlaceholderText('Ej. Feria de Oportunidades UMSS'), {
    target: { value: 'Feria tecnológica' },
  });

  const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]');
  const timeInputs = container.querySelectorAll<HTMLInputElement>('input[type="time"]');

  fireEvent.change(dateInputs[0], { target: { value: '2026-10-12' } });
  fireEvent.change(timeInputs[0], { target: { value: '09:00' } });
  fireEvent.change(dateInputs[1], {
    target: { value: overrides.endDate ?? '2026-10-12' },
  });
  fireEvent.change(timeInputs[1], {
    target: { value: overrides.endTime ?? '17:00' },
  });
  fireEvent.change(screen.getByPlaceholderText('Ej. 150'), {
    target: { value: overrides.capacity ?? '50' },
  });
}

function clickDesktopDraftButton() {
  fireEvent.click(screen.getAllByRole('button', { name: 'Guardar borrador' })[0]);
}

describe('EventForm HU1', () => {
  it('bloquea el formulario vacío sin ejecutar onSubmit', () => {
    const onSubmit = jest.fn();
    render(<EventForm onSubmit={onSubmit} />);

    clickDesktopDraftButton();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('5 campos por revisar')).toBeInTheDocument();
  });

  it('rechaza cupo cero y cupos no enteros', () => {
    const onSubmit = jest.fn();
    const { container } = render(<EventForm onSubmit={onSubmit} />);

    fillValidForm(container, { capacity: '0' });
    clickDesktopDraftButton();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Ingresa un cupo entero mayor a 0.')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ej. 150'), {
      target: { value: '1.5' },
    });
    clickDesktopDraftButton();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Ingresa un cupo entero mayor a 0.')).toBeInTheDocument();
  });

  it('rechaza una fecha final anterior al inicio', () => {
    const onSubmit = jest.fn();
    const { container } = render(<EventForm onSubmit={onSubmit} />);

    fillValidForm(container, { endDate: '2026-10-11' });
    clickDesktopDraftButton();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText('Debe ser posterior al inicio.')).toHaveLength(2);
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
        expect.objectContaining({ status: EVENT_STATUS.BORRADOR }),
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
});

describe('CreateEventPage HU1', () => {
  beforeEach(() => {
    mockCreateEvent.mockReset();
    mockPush.mockReset();
  });

  it('Cancelar vuelve a /events sin guardar', () => {
    render(<CreateEventPage />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);

    expect(mockCreateEvent).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/events');
  });

  it('muestra feedback después de guardar un borrador', async () => {
    mockCreateEvent.mockResolvedValueOnce({});
    const { container } = render(<CreateEventPage />);

    fillValidForm(container);
    clickDesktopDraftButton();

    expect(await screen.findByRole('status')).toHaveTextContent('Borrador guardado correctamente.');
    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: EVENT_STATUS.BORRADOR }),
    );
  });

  it('muestra el error real devuelto por el servicio', async () => {
    mockCreateEvent.mockRejectedValueOnce(new Error('Se requiere una sesión autenticada.'));
    const { container } = render(<CreateEventPage />);

    fillValidForm(container);
    clickDesktopDraftButton();

    expect(await screen.findByRole('alert')).toHaveTextContent('Se requiere una sesión autenticada.');
  });

  it('muestra publicación exitosa y Volver a eventos navega a /events', async () => {
    mockCreateEvent.mockResolvedValueOnce({});
    const { container } = render(<CreateEventPage />);

    fillValidForm(container);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar evento' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Publicar evento' }),
    );

    expect(await screen.findByText('¡Evento publicado correctamente!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a eventos' }));
    expect(mockPush).toHaveBeenCalledWith('/events');
  });
});
