import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ReceivedRequests } from './received-requests';
import { getMentorProfile } from '../services/mentorship-api';
import { getReceivedRequest, listReceivedRequests, ReceivedRequestsError, respondToReceivedRequest } from '../services/received-requests-api';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter, useSearchParams: () => new URLSearchParams() }));
jest.mock('../services/mentorship-api', () => ({ getMentorProfile: jest.fn() }));
jest.mock('../services/received-requests-api', () => ({
  getReceivedRequest: jest.fn(),
  listReceivedRequests: jest.fn(),
  respondToReceivedRequest: jest.fn(),
  ReceivedRequestsError: class ReceivedRequestsError extends Error {
    constructor(message: string, public readonly status: number, public readonly code?: string) { super(message); }
  },
}));

const request = (estado: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'CANCELADO' = 'PENDIENTE') => ({
  id: 'request-1', id_mentor: 'mentor-1', solicitante: { id: 'user-1', nombre: 'Juan Pérez' },
  fecha: '2026-10-27', hora_inicio: '15:00', hora_fin: '16:00', mensaje: 'Necesito orientación para mi proyecto.',
  estado, fecha_creacion: '2026-10-20', fecha_respuesta: estado === 'PENDIENTE' ? null : '2026-10-21',
});

beforeEach(() => {
  jest.clearAllMocks();
  (getMentorProfile as jest.Mock).mockResolvedValue({ isActive: true });
  (listReceivedRequests as jest.Mock).mockImplementation(async (status: string) => {
    const item = status === 'PENDIENTE' ? request() : null;
    return { items: item ? [item] : [], page: 1, pageSize: 20, total: item ? 1 : 0, totalPages: 1 };
  });
  (getReceivedRequest as jest.Mock).mockResolvedValue(request());
  (respondToReceivedRequest as jest.Mock).mockResolvedValue(request('ACEPTADO'));
});

it('muestra la bandeja pendiente con solicitante, fecha de envío y motivo', async () => {
  render(<ReceivedRequests />);
  expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
  expect(screen.getByText(/Enviada: 2026-10-20/)).toBeInTheDocument();
  expect(screen.getByText('Necesito orientación para mi proyecto.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cargar datos de prueba' })).not.toBeInTheDocument();
  expect(screen.queryByText(/Modo de prueba/)).not.toBeInTheDocument();
  expect(listReceivedRequests).toHaveBeenCalledWith('PENDIENTE', 1, expect.anything());
});

it('filtra por aceptadas desde el servicio', async () => {
  render(<ReceivedRequests />);
  await screen.findByText('Juan Pérez');
  fireEvent.click(screen.getByRole('tab', { name: /Aceptadas/ }));
  await waitFor(() => expect(listReceivedRequests).toHaveBeenCalledWith('ACEPTADO', 1, expect.anything()));
  expect(await screen.findByText('No tienes solicitudes de mentoría')).toBeInTheDocument();
});

it('consulta el detalle completo y muestra estado, fecha, área y mensaje', async () => {
  render(<ReceivedRequests />);
  await screen.findByText('Juan Pérez');
  fireEvent.click(screen.getByRole('button', { name: 'Ver detalles' }));
  expect(await screen.findByRole('heading', { name: 'Detalle de solicitud' })).toBeInTheDocument();
  expect(getReceivedRequest).toHaveBeenCalledWith('request-1');
  expect(screen.getByText('Fecha de envío')).toBeInTheDocument();
  expect(screen.getByText('Área técnica solicitada')).toBeInTheDocument();
  expect(screen.getByText('Pendiente')).toBeInTheDocument();
  expect(screen.getByText('Necesito orientación para mi proyecto.')).toBeInTheDocument();
});

it('cancelar en la confirmación no envía petición y deja la solicitud pendiente', async () => {
  render(<ReceivedRequests />);
  await screen.findByText('Juan Pérez');
  fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('Juan Pérez')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
  expect(respondToReceivedRequest).not.toHaveBeenCalled();
  expect(screen.getByText('Pendiente')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Aceptar' })).toBeEnabled();
});

it('acepta tras confirmar y muestra el estado nuevo y la fecha de respuesta', async () => {
  (respondToReceivedRequest as jest.Mock).mockImplementation(async () => {
    (listReceivedRequests as jest.Mock).mockImplementation(async (status: string) => {
      const item = status === 'ACEPTADO' ? request('ACEPTADO') : null;
      return { items: item ? [item] : [], page: 1, pageSize: 20, total: item ? 1 : 0, totalPages: 1 };
    });
    return request('ACEPTADO');
  });
  render(<ReceivedRequests />);
  await screen.findByText('Juan Pérez');
  fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
  expect(await screen.findByText('Solicitud aceptada')).toBeInTheDocument();
  expect(respondToReceivedRequest).toHaveBeenCalledWith('request-1', 'accept');
  fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
  expect(await screen.findByText('Aceptada')).toBeInTheDocument();
  expect(screen.getByText(/Respondida: 2026-10-21/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
});

it('rechaza tras confirmar y muestra el mensaje exacto', async () => {
  (respondToReceivedRequest as jest.Mock).mockResolvedValue(request('RECHAZADO'));
  (listReceivedRequests as jest.Mock).mockImplementation(async (status: string) => {
    const item = status === 'RECHAZADO' ? request('RECHAZADO') : status === 'PENDIENTE' ? request() : null;
    return { items: item ? [item] : [], page: 1, pageSize: 20, total: item ? 1 : 0, totalPages: 1 };
  });
  render(<ReceivedRequests />);
  await screen.findByText('Juan Pérez');
  fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
  expect(await screen.findByText('Solicitud rechazada')).toBeInTheDocument();
  expect(respondToReceivedRequest).toHaveBeenCalledWith('request-1', 'reject');
});

it('muestra conflicto y actualiza estado cuando la respuesta perdió la carrera', async () => {
  (respondToReceivedRequest as jest.Mock).mockRejectedValue(new ReceivedRequestsError('conflict', 409, 'SOLICITUD_NO_PENDIENTE'));
  (getReceivedRequest as jest.Mock).mockResolvedValue(request('RECHAZADO'));
  (listReceivedRequests as jest.Mock).mockImplementation(async (status: string) => {
    const item = status === 'PENDIENTE' ? request() : status === 'RECHAZADO' ? request('RECHAZADO') : null;
    return { items: item ? [item] : [], page: 1, pageSize: 20, total: item ? 1 : 0, totalPages: 1 };
  });
  render(<ReceivedRequests />);
  await screen.findByText('Juan Pérez');
  fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
  expect(await screen.findByText('Esta solicitud ya no está pendiente')).toBeInTheDocument();
  expect(await screen.findByText('Rechazada')).toBeInTheDocument();
  expect(getReceivedRequest).toHaveBeenCalledWith('request-1');
});

it('mantiene pendiente y permite reintentar después de un error del servidor', async () => {
  (respondToReceivedRequest as jest.Mock).mockRejectedValueOnce(new Error('network'));
  render(<ReceivedRequests />);
  await screen.findByText('Juan Pérez');
  fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
  expect(await within(screen.getByRole('dialog')).findByText('No se pudo registrar tu respuesta. Intenta nuevamente.')).toBeInTheDocument();
  expect(screen.getByText('Pendiente')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirmar' })).toBeEnabled();
});

it('redirige a un usuario que no participa activamente como mentor', async () => {
  (getMentorProfile as jest.Mock).mockResolvedValue({ isActive: false });
  render(<ReceivedRequests />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/mentorship'));
  expect(listReceivedRequests).not.toHaveBeenCalled();
});
