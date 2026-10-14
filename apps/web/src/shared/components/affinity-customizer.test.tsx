import React from 'react';
import { render, screen } from '@testing-library/react';
import { AffinityCustomizer } from './affinity-customizer';
import * as affinityService from '../services/affinity-service';

jest.mock('../services/affinity-service');

const EXPECTED_LABELS = [
  'Desarrollo de Software',
  'Cloud/DevOps e Infraestructura',
  'Ciencia de Datos/IA',
  'Aseguramiento de Calidad (QA)',
  'Ciberseguridad y Redes',
  'Gestión de TI',
];

describe('AffinityCustomizer', () => {
  const mockGetAffinityConfig = affinityService.getAffinityConfig as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it('muestra las 6 etiquetas en orden fijo con "Ciencia de Datos/IA"', () => {
    render(<AffinityCustomizer />);

    const labels = EXPECTED_LABELS.map((label) => screen.getByText(label));

    labels.forEach((label, index) => {
      expect(label).toBeInTheDocument();
      if (index === 0) return;
      const previous = labels[index - 1];
      expect(previous.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  it('muestra las ponderaciones que define el sistema en modo solo lectura', async () => {
    render(<AffinityCustomizer />);

    expect(await screen.findByText('Ponderación: 4')).toBeInTheDocument();
    expect(screen.getAllByText(/^Ponderación: /)).toHaveLength(6);
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(mockGetAffinityConfig).toHaveBeenCalledTimes(1);
  });
});
