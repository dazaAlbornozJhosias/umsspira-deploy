import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AffinityCalculator } from './affinity-calculator';
import * as affinityService from '../services/affinity-service';

jest.mock('../services/affinity-service');

describe('AffinityCalculator Component', () => {
  const mockCalculateAffinityVector = affinityService.calculateAffinityVector as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el estado inicial con el botón para solicitar cálculo', () => {
    render(<AffinityCalculator />);

    expect(screen.getByText('Cálculo de Vectores de Afinidad')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Cálculo de Afinidad')).toBeInTheDocument();
  });

  it('muestra el spinner de carga al hacer clic en calcular', async () => {
    mockCalculateAffinityVector.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    render(<AffinityCalculator />);

    const button = screen.getByText('Solicitar Cálculo de Afinidad');
    fireEvent.click(button);

    expect(
      screen.getByText('Cargando vectores de afinidad...'),
    ).toBeInTheDocument();
  });

  it('muestra mensaje de error y permite reintentar cuando la solicitud falla', async () => {
    const errorMsg = 'No se pudo conectar con el servicio de cálculo. Intente nuevamente.';
    mockCalculateAffinityVector.mockRejectedValueOnce(new Error(errorMsg));

    render(<AffinityCalculator />);

    // Iniciar solicitud
    const button = screen.getByText('Solicitar Cálculo de Afinidad');
    fireEvent.click(button);

    // Esperar mensaje de error
    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Reintentar');
    expect(retryButton).toBeInTheDocument();

    // Reintento exitoso
    const successData = {
      graduateId: 'id-1',
      calculatedAt: '2026-09-29T12:00:00.000Z',
      areas: [{ area: 'software-development', affinity: 82.5 }],
    };
    mockCalculateAffinityVector.mockResolvedValueOnce(successData);

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Cálculo completado exitosamente')).toBeInTheDocument();
    });
  });
});
