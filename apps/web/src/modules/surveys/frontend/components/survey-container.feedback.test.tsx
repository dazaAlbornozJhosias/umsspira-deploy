import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApiError } from '@/shared/services/api-client';
import { SurveyContainer } from './survey-container';
import { submitSurvey } from '../services/surveys.service';

// En Jest, renderizar un <img> sencillo evita que la implementación interna
// de next/image pase fetchPriority al DOM de React 18 en este entorno de pruebas.
// El componente real de Next.js permanece sin cambios en el navegador.
jest.mock('next/image', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: ({ src, alt, width, height }: {
      src: string;
      alt: string;
      width?: number;
      height?: number;
    }) => React.createElement('img', { src, alt, width, height }),
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('../hooks/use-survey-user-id', () => ({
  useSurveyUserId: () => 'usuario-prueba',
}));
jest.mock('../services/surveys.service', () => ({
  ...jest.requireActual('../services/surveys.service'),
  submitSurvey: jest.fn(),
}));

const mockedSubmit = submitSurvey as jest.Mock;

beforeEach(() => {
  mockedSubmit.mockReset();
  window.localStorage.clear();
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
});

afterEach(() => {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
});

function openReview() {
  render(<SurveyContainer />);
  fireEvent.click(screen.getByRole('radio', { name: /No trabaja/i }));
  fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirmar y enviar' })).toBeEnabled();
}

describe('T3.4: integración visual del formulario y confirmación', () => {
  it('muestra carga, evita doble envío y hace visible el éxito sin cerrar el modal prematuramente', async () => {
    let complete!: () => void;
    mockedSubmit.mockImplementationOnce(() => new Promise<void>((resolve) => { complete = resolve; }));
    openReview();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y enviar' }));
    expect(screen.getByRole('dialog', { name: 'Enviando encuesta...' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Envío de encuesta en curso' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar y enviar' })).not.toBeInTheDocument();
    expect(mockedSubmit).toHaveBeenCalledTimes(1);
    await act(async () => { complete(); });
    expect(await screen.findByRole('dialog', { name: 'Encuesta enviada correctamente' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar y enviar' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Encuesta enviada correctamente').closest('[role="status"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeDisabled();
  });

  it('muestra el error dentro del modal, conserva respuestas y permite reintentar', async () => {
    mockedSubmit.mockRejectedValueOnce(new ApiError(500, 'Fallo del servidor'));
    mockedSubmit.mockResolvedValueOnce(undefined);
    openReview();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y enviar' }));
    expect(await screen.findByText('No se pudo enviar la encuesta. Intente nuevamente')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /No trabaja/i })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar envío' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument());
    expect(mockedSubmit).toHaveBeenCalledTimes(2);
  });

  it('muestra el aviso offline sobre el modal y distingue falla de conexión', async () => {
    mockedSubmit.mockRejectedValueOnce(new ApiError(0, 'No hay conexión'));
    openReview();
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false });
    fireEvent(window, new Event('offline'));
    expect(screen.getAllByText('Sin conexión a Internet').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y enviar' }));
    expect(await screen.findByText('No se pudo enviar la encuesta. Intente nuevamente')).toBeInTheDocument();
    expect(screen.getByText(/No fue posible conectar con el servidor/)).toBeInTheDocument();
  });
});
