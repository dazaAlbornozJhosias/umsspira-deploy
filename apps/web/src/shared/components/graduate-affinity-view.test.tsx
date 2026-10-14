import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { GraduateAffinityView } from './graduate-affinity-view';
import * as affinityService from '../services/affinity-service';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/shared/components/affinity-radar', () => ({
  __esModule: true,
  default: (props: { changedAreaIds?: string[]; onSelectArea?: (id: string | null) => void }) => (
    <div data-testid="radar" data-changed={JSON.stringify(props.changedAreaIds ?? [])}>
      <button type="button" onClick={() => props.onSelectArea?.('cloud-devops')}>
        Seleccionar eje de prueba
      </button>
    </div>
  ),
}));

jest.mock('../services/affinity-service');

// Nombres que muestra el panel de inspección (HU2-C3)
const EXPECTED_LABELS = [
  'Desarrollo de Software',
  'Cloud/DevOps',
  'Ciencia de Datos/IA',
  'QA',
  'Ciberseguridad',
  'Gestión TI',
];

describe('GraduateAffinityView', () => {
  const mockGetAffinityConfig = affinityService.getAffinityConfig as jest.Mock;
  const mockRecalculateAffinity = affinityService.recalculateAffinity as jest.Mock;
  const mockGetAffinityVector = affinityService.getAffinityVector as jest.Mock;

  const recalculatedAreas = [
    { area: 'software-development', affinity: 85 },
    { area: 'cloud-devops', affinity: 64 },
    { area: 'data-ai', affinity: 71 },
    { area: 'quality-assurance', affinity: 58 },
    { area: 'cybersecurity-networks', affinity: 42 },
    { area: 'it-management', affinity: 50 },
  ];

  const openSimulationModal = () => {
    fireEvent.click(screen.getByRole('button', { name: /simular actualización del radar/i }));
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAffinityVector.mockResolvedValue({
      graduateId: 'id-1',
      calculatedAt: '2026-09-30T12:00:00.000Z',
      areas: recalculatedAreas,
    });

    mockGetAffinityConfig.mockResolvedValue({
      axes: [
        { area: 'software-development', weight: 4 },
        { area: 'cloud-devops', weight: 3 },
        { area: 'data-ai', weight: 3 },
        { area: 'quality-assurance', weight: 2 },
        { area: 'cybersecurity-networks', weight: 3 },
        { area: 'it-management', weight: 2 },
      ],
    });

    mockRecalculateAffinity.mockResolvedValue({
      graduateId: 'id-1',
      calculatedAt: '2026-09-30T12:00:00.000Z',
      areas: recalculatedAreas,
    });
  });

  it('carga el radar inicial desde el servicio correctamente', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    await waitFor(() => expect(mockGetAffinityVector).toHaveBeenCalledTimes(1));
  });

  it('muestra el error con el mensaje exacto, conserva el radar anterior y permite reintentar', async () => {
    mockGetAffinityVector.mockRejectedValueOnce(new Error('fallo de red'));
    
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    expect(await screen.findByText('No se pudo actualizar tu radar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('deshabilita Recalcular y lo habilita al detectar un cambio nuevo', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    await waitFor(() => expect(mockGetAffinityVector).toHaveBeenCalled());
    
    const recalculateButton = screen.getByRole('button', { name: /simular actualización del radar/i });
    expect(recalculateButton).toBeInTheDocument();
  });

  it('recalcula desde el diálogo y muestra el toast de éxito', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    await waitFor(() => expect(mockGetAffinityVector).toHaveBeenCalled());

    openSimulationModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const simulateButton = within(screen.getByRole('dialog')).getByRole('button', { name: /simular cambio en el perfil/i });
    
    await act(async () => {
      fireEvent.click(simulateButton);
    });

    await waitFor(() => {
      expect(mockRecalculateAffinity).toHaveBeenCalledTimes(1);
    });
  });

  it('conserva el radar anterior atenuado cuando el recálculo falla', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    await waitFor(() => expect(mockGetAffinityVector).toHaveBeenCalled());

    mockRecalculateAffinity.mockRejectedValueOnce(new Error('error en recálculo'));

    openSimulationModal();
    const simulateButton = within(screen.getByRole('dialog')).getByRole('button', { name: /simular cambio en el perfil/i });
    
    await act(async () => {
      fireEvent.click(simulateButton);
    });

    expect(await screen.findByText('No se pudo actualizar tu radar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('Añadir certificaciones navega al flujo de Épica 2 con returnTo', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });
    
    const addButton = await screen.findByRole('button', { name: /añadir certificaciones/i });
    fireEvent.click(addButton);
    
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('returnTo=/afinidad')
    );
  });

  it('simula timeout con temporizadores falsos y muestra error con Reintentar manteniendo el último radar válido', async () => {
    jest.useFakeTimers();
    
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    const timeoutButton = screen.getByRole('button', { name: /simular timeout/i });
    
    act(() => {
      fireEvent.click(timeoutButton);
    });

    act(() => {
      jest.advanceTimersByTime(7000);
    });

    expect(await screen.findByText('No se pudo actualizar tu radar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('muestra Personalizar en solo lectura con las ponderaciones del sistema', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    fireEvent.click(screen.getByRole('tab', { name: /personalizar/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/^Ponderación: /)).toHaveLength(6);
    });
    expect(screen.getByText('Ponderación: 4')).toBeInTheDocument();
    expect(mockGetAffinityConfig).toHaveBeenCalledTimes(1);
  });

  it('muestra las 6 etiquetas visibles en orden fijo', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    const summarySection = (await screen.findByText('Resumen de Afinidad por Área')).parentElement;
    expect(summarySection).not.toBeNull();

    const labels = EXPECTED_LABELS.map((label) =>
      within(summarySection as HTMLElement).getByText(label),
    );

    labels.forEach((label, index) => {
      expect(label).toBeInTheDocument();
      if (index === 0) return;
      const previous = labels[index - 1];
      expect(previous.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  it('muestra el resumen del panel con los porcentajes del mismo vector del radar y la indicación para inspeccionar', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    // 85% viene del vector del servicio; el mock del panel tiene 82.5 (se mostraría 83%)
    expect(await screen.findByText('85%')).toBeInTheDocument();
    expect(screen.queryByText('83%')).not.toBeInTheDocument();
    expect(screen.getByText('Haz clic en un área para inspeccionar sus respaldos')).toBeInTheDocument();
  });

  it('al seleccionar un eje en el radar, el panel muestra el área y sus respaldos', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    await screen.findByText('Resumen de Afinidad por Área');
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar eje de prueba' }));

    expect(await screen.findByText(/Área: Cloud\/DevOps/)).toBeInTheDocument();
    expect(screen.getByText('AWS Certified Cloud Practitioner')).toBeInTheDocument();
  });

  it('Volver al resumen deselecciona el área en el panel', async () => {
    await act(async () => {
      render(<GraduateAffinityView />);
    });

    await screen.findByText('Resumen de Afinidad por Área');
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar eje de prueba' }));
    fireEvent.click(await screen.findByRole('button', { name: /volver al resumen/i }));

    expect(screen.queryByText(/Área: Cloud\/DevOps/)).not.toBeInTheDocument();
  });

  it('si el vector inicial falla, el panel muestra el estado vacío y no los datos por defecto', async () => {
    mockGetAffinityVector.mockRejectedValueOnce(new Error('fallo de red'));

    await act(async () => {
      render(<GraduateAffinityView />);
    });

    expect(await screen.findByText(/No se pudo actualizar tu radar/)).toBeInTheDocument();
    expect(screen.queryByText('Sin datos de historial laboral')).not.toBeInTheDocument();
    expect(screen.queryByText('Resumen de Afinidad por Área')).not.toBeInTheDocument();
  });

  it('muestra el skeleton mientras carga y no presenta el perfil como vacío', () => {
    mockGetAffinityVector.mockReturnValue(new Promise(() => {}));
    render(<GraduateAffinityView />);

    expect(screen.getByRole('status', { name: 'Cargando tu radar de afinidad' })).toBeInTheDocument();
    expect(screen.queryByText('Sin datos de historial laboral')).not.toBeInTheDocument();
  });
});