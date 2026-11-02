import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from '@testing-library/react';
import { GraduateAffinityView } from './graduate-affinity-view';
import * as affinityService from '../services/affinity-service';
import { DEBOUNCE_MS } from '../hooks/use-debounced-batch';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/shared/components/affinity-radar', () => ({
  __esModule: true,
  default: (props: {
    changedAreaIds?: string[];
    onSelectArea?: (id: string | null) => void;
  }) => (
    <div
      data-testid="radar"
      data-changed={JSON.stringify(props.changedAreaIds ?? [])}
    >
      <button
        type="button"
        onClick={() => props.onSelectArea?.('cloud-devops')}
      >
        Seleccionar eje de prueba
      </button>

      <button
        type="button"
        onClick={() => props.onSelectArea?.('cybersecurity-networks')}
      >
        Seleccionar Ciberseguridad
      </button>
    </div>
  ),
}));

jest.mock('../services/affinity-service');

// Nombres que muestra el panel de inspección, en el orden del mockup:
// de mayor a menor porcentaje (HU-3)
const EXPECTED_LABELS = [
  'Desarrollo de Software',
  'Ciencia de Datos & IA',
  'Cloud, DevOps & Infraestructura',
  'Aseguramiento de Calidad (QA)',
  'Gestión de TI & Gobernanza',
  'Ciberseguridad & Redes',
];

const evidence = {
  software: [
    {
      type: 'certification',
      title: 'Certificación Avanzada de React',
      detail: 'Emitido por Meta.',
    },
    {
      type: 'project',
      title: 'Plataforma E-Commerce Web',
      detail: 'Desarrollo full-stack con React y Node.',
    },
  ],
  cloud: [
    {
      type: 'certification',
      title: 'AWS Certified Cloud Practitioner',
      detail: 'Amazon Web Services.',
    },
  ],
  data: [
    {
      type: 'certification',
      title: 'Certificación Profesional de Machine Learning',
      detail: 'Emitido por Coursera.',
    },
  ],
  qa: [
    {
      type: 'certification',
      title: 'ISTQB Foundation Level',
      detail: 'Certified Tester.',
    },
  ],
  cybersecurity: [
    {
      type: 'certification',
      title: 'Cisco Certified Network Associate (CCNA)',
      detail: 'Cisco Systems - Enrutamiento, Conmutación y Redes.',
    },
    {
      type: 'project',
      title: 'Configuración de Firewalls y Políticas SecOps',
      detail: 'Seguridad perimetral y auditoría de accesos.',
    },
  ],
  management: [
    {
      type: 'certification',
      title: 'Professional Scrum Master (PSM I)',
      detail: 'Scrum.org - Metodologías Ágiles.',
    },
  ],
};

const recalculatedAreas = [
  {
    area: 'software-development',
    affinity: 85,
    keywords: ['React', 'TypeScript', 'Node.js'],
    evidence: evidence.software,
  },
  {
    area: 'cloud-devops',
    affinity: 64,
    keywords: ['AWS', 'Docker'],
    evidence: evidence.cloud,
  },
  {
    area: 'data-ai',
    affinity: 71,
    keywords: ['Python', 'Machine Learning'],
    evidence: evidence.data,
  },
  {
    area: 'quality-assurance',
    affinity: 58,
    keywords: ['Jest', 'Cypress'],
    evidence: evidence.qa,
  },
  {
    area: 'cybersecurity-networks',
    affinity: 42,
    keywords: ['SecOps', 'Firewalls'],
    evidence: evidence.cybersecurity,
  },
  {
    area: 'it-management',
    affinity: 50,
    keywords: ['Scrum', 'Agile'],
    evidence: evidence.management,
  },
];

const makeVector = (areas = recalculatedAreas, extra: Record<string, unknown> = {}) => ({
  graduateId: 'id-1',
  calculatedAt: '2026-09-30T12:00:00.000Z',
  hasLaborHistory: true,
  areas,
  ...extra,
});

// Panel que contiene las seis barras de "Resumen de tu afinidad"
const getSummaryPanel = async (): Promise<HTMLElement> => {
  const heading = await screen.findByText('Resumen de tu afinidad');
  const panel = heading.closest('.flex-col');

  if (!panel) {
    throw new Error('No se encontró el panel de resumen de afinidad');
  }

  return panel as HTMLElement;
};

const openSimulationModal = () => {
  fireEvent.click(
    screen.getByRole('button', {
      name: /simular actualización del radar/i,
    })
  );
};

const clickSimulateProfileChange = async () => {
  openSimulationModal();

  const dialog = screen.getByRole('dialog');
  const simulateButton = within(dialog).getByRole('button', {
    name: /simular cambio en el perfil/i,
  });

  await act(async () => {
    fireEvent.click(simulateButton);
  });
};

describe('GraduateAffinityView', () => {
  const mockGetAffinityConfig =
    affinityService.getAffinityConfig as jest.Mock;
  const mockRecalculateAffinity =
    affinityService.recalculateAffinity as jest.Mock;
  const mockGetAffinityVector =
    affinityService.getAffinityVector as jest.Mock;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENABLE_SIMULATION_CONTROLS: 'true',
    };
    jest.clearAllMocks();
    mockGetAffinityVector.mockReset();
    mockGetAffinityConfig.mockReset();
    mockRecalculateAffinity.mockReset();

    mockGetAffinityVector.mockResolvedValue(makeVector());
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
    mockRecalculateAffinity.mockResolvedValue(makeVector());
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  it('carga el radar inicial desde el servicio', async () => {
    render(<GraduateAffinityView />);

    await waitFor(() => {
      expect(mockGetAffinityVector).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Resumen de tu afinidad')).toBeInTheDocument();
    expect(screen.getByTestId('radar')).toBeInTheDocument();
  });

  it('muestra el error si falla la carga inicial', async () => {
    mockGetAffinityVector.mockRejectedValueOnce(new Error('fallo de red'));

    render(<GraduateAffinityView />);

    expect(
      await screen.findByText('No se pudo actualizar tu radar')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /reintentar/i })
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Resumen de tu afinidad')
    ).not.toBeInTheDocument();
  });

  it('muestra el diálogo al simular una actualización', async () => {
    render(<GraduateAffinityView />);

    await waitFor(() => {
      expect(mockGetAffinityVector).toHaveBeenCalled();
    });

    openSimulationModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('recalcula desde el diálogo y muestra el toast de éxito', async () => {
    render(<GraduateAffinityView />);

    await waitFor(() => {
      expect(mockGetAffinityVector).toHaveBeenCalled();
    });

    await clickSimulateProfileChange();

    await waitFor(() => {
      expect(mockRecalculateAffinity).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Radar actualizado')).toBeInTheDocument();
  });

  it('muestra un error si falla el recálculo', async () => {
    render(<GraduateAffinityView />);

    await waitFor(() => {
      expect(mockGetAffinityVector).toHaveBeenCalled();
    });

    mockRecalculateAffinity.mockRejectedValueOnce(
      new Error('error en recálculo')
    );

    await clickSimulateProfileChange();

    expect(
      await screen.findByText('No se pudo actualizar tu radar')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /reintentar/i })
    ).toBeInTheDocument();
  });

  it('navega al flujo de certificaciones con returnTo', async () => {
    render(<GraduateAffinityView />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: /añadir certificaciones/i,
      })
    );

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('returnTo=/afinidad')
    );
  });

  it('muestra el skeleton mientras carga el vector inicial', () => {
    mockGetAffinityVector.mockReturnValue(new Promise(() => {}));

    render(<GraduateAffinityView />);

    expect(
      screen.getByRole('status', {
        name: 'Cargando tu radar de afinidad',
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Sin datos de historial laboral')
    ).not.toBeInTheDocument();
  });

  it('muestra las seis etiquetas visibles en el orden esperado', async () => {
    render(<GraduateAffinityView />);

    const summarySection = (
      await screen.findByText('Resumen de tu afinidad')
    ).closest('.flex-col');

    expect(summarySection).not.toBeNull();

    const labels = EXPECTED_LABELS.map((label) =>
      within(summarySection as HTMLElement).getByText(label)
    );

    labels.forEach((label, index) => {
      expect(label).toBeInTheDocument();

      if (index === 0) return;

      expect(
        labels[index - 1].compareDocumentPosition(label) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });
  });

  it('muestra los porcentajes del vector cargado', async () => {
    render(<GraduateAffinityView />);

    expect(await screen.findByText('85%')).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Haz clic en un área para inspeccionar sus respaldos'
      )
    ).toBeInTheDocument();
  });

  it('al seleccionar Cloud muestra las evidencias del vector cargado', async () => {
    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Seleccionar eje de prueba',
      })
    );

    expect(
      await screen.findByText(/Área: Cloud, DevOps & Infraestructura/)
    ).toBeInTheDocument();

    expect(
      screen.getByText('AWS Certified Cloud Practitioner')
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Cisco Certified Network Associate (CCNA)')
    ).not.toBeInTheDocument();
  });

  it('al seleccionar Ciberseguridad muestra sus evidencias', async () => {
    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Seleccionar Ciberseguridad',
      })
    );

    expect(
      await screen.findByText(/Área: Ciberseguridad & Redes/)
    ).toBeInTheDocument();

    expect(
      screen.getByText('Cisco Certified Network Associate (CCNA)')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Configuración de Firewalls y Políticas SecOps')
    ).toBeInTheDocument();
  });

  it('volver al resumen deselecciona el área', async () => {
    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Seleccionar eje de prueba',
      })
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: /volver al resumen/i,
      })
    );

    expect(
      screen.queryByText(/Área: Cloud, DevOps & Infraestructura/)
    ).not.toBeInTheDocument();
  });

  it('conserva la afinidad del backend aunque no incluya evidencias', async () => {
    const areasWithoutCyberEvidence = recalculatedAreas.map((area) => {
      if (area.area !== 'cybersecurity-networks') return area;

      return {
        ...area,
        affinity: 95,
        keywords: [],
        evidence: [],
      };
    });

    mockGetAffinityVector.mockResolvedValueOnce(
      makeVector(areasWithoutCyberEvidence)
    );

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    // Los respaldos no forman parte del contrato HTTP del radar:
    // su ausencia no invalida el porcentaje calculado por el motor.
    expect(screen.getByText('1. Ciberseguridad & Redes (95%)')).toBeInTheDocument();
    expect(screen.getByText('2. Desarrollo de Software (85%)')).toBeInTheDocument();
    expect(screen.getByText('3. Ciencia de Datos & IA (71%)')).toBeInTheDocument();
  });

  it('actualiza las palabras clave después de recalcular', async () => {
    const initialAreas = recalculatedAreas.map((area) => {
      if (area.area !== 'software-development') return area;

      return {
        ...area,
        keywords: ['Node.js', 'React'],
        evidence: [
          {
            type: 'certification',
            title: 'Certificación de Node.js y React',
            detail: 'Tecnologías de desarrollo web.',
          },
        ],
      };
    });

    const nextAreas = recalculatedAreas.map((area) => {
      if (area.area !== 'software-development') return area;

      return {
        ...area,
        keywords: ['Kubernetes', 'Go'],
        evidence: [
          {
            type: 'certification',
            title: 'Certificación de Kubernetes y Go',
            detail: 'Tecnologías de desarrollo y despliegue.',
          },
        ],
      };
    });

    mockGetAffinityVector.mockResolvedValueOnce(makeVector(initialAreas));
    mockRecalculateAffinity.mockResolvedValueOnce(makeVector(nextAreas));

    render(<GraduateAffinityView />);

    expect(await screen.findByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();

    await clickSimulateProfileChange();

    await waitFor(() => {
      expect(screen.getByText('Kubernetes')).toBeInTheDocument();
      expect(screen.getByText('Go')).toBeInTheDocument();
    });

    expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
  });

  it('no muestra palabras clave de un área sin evidencias', async () => {
    const areas = recalculatedAreas.map((area) => {
      if (area.area !== 'cybersecurity-networks') return area;

      return {
        ...area,
        affinity: 0,
        keywords: ['CCNA', 'Firewalls'],
        evidence: [],
      };
    });

    mockGetAffinityVector.mockResolvedValueOnce(makeVector(areas));

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    expect(screen.queryByText('CCNA')).not.toBeInTheDocument();
    expect(screen.queryByText('Firewalls')).not.toBeInTheDocument();
  });

  it('personalizar muestra las ponderaciones de la configuración', async () => {
    render(<GraduateAffinityView />);

    fireEvent.click(
      await screen.findByRole('tab', { name: /personalizar/i })
    );

    await waitFor(() => {
      expect(screen.getAllByText(/^Ponderación: /)).toHaveLength(6);
    });

    expect(await screen.findByText('Ponderación: 4')).toBeInTheDocument();
    expect(mockGetAffinityConfig).toHaveBeenCalledTimes(1);
  });

  it('muestra el estado vacío con "Completar perfil" y oculta el indicador de actualización cuando no hay datos', async () => {
    mockGetAffinityVector.mockResolvedValueOnce({ areas: [] });

    render(<GraduateAffinityView />);

    expect(await screen.findByText(/Completar perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/Aún no podemos calcular tus áreas de mayor afinidad/i)).toBeInTheDocument();

    expect(screen.queryByText(/Última actualización/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vector Calculado/i)).not.toBeInTheDocument();
  });

  it('muestra la fecha real del cálculo en la píldora de última actualización', async () => {
    mockGetAffinityVector.mockResolvedValueOnce({
      graduateId: 'grad-1',
      calculatedAt: '2026-05-15T10:00:00.000Z',
      areas: [
        { area: 'software-development', affinity: 90 },
        { area: 'cloud-devops', affinity: 70 },
        { area: 'data-ai', affinity: 60 },
        { area: 'quality-assurance', affinity: 50 },
        { area: 'cybersecurity-networks', affinity: 40 },
        { area: 'it-management', affinity: 30 },
      ],
    });

    render(<GraduateAffinityView />);

    expect(await screen.findByText(/Última actualización:/i)).toBeInTheDocument();
    expect(screen.getByText('May 2026')).toBeInTheDocument();
  });

  it('muestra "No disponible" y no inventa una fecha cuando el servicio no devuelve calculatedAt', async () => {
    mockGetAffinityVector.mockResolvedValueOnce({
      graduateId: 'grad-1',
      calculatedAt: undefined as any,
      areas: [
        { area: 'software-development', affinity: 90 },
        { area: 'cloud-devops', affinity: 70 },
        { area: 'data-ai', affinity: 60 },
        { area: 'quality-assurance', affinity: 50 },
        { area: 'cybersecurity-networks', affinity: 40 },
        { area: 'it-management', affinity: 30 },
      ],
    });

    render(<GraduateAffinityView />);

    expect(await screen.findByText(/Última actualización:/i)).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
  });

  it('renderiza los botones de Simular Actualización y Simular Timeout alineados', async () => {
    render(<GraduateAffinityView />);

    expect(await screen.findByRole('button', { name: /Simular Actualización/i })).toBeInTheDocument();
    expect(screen.getByText(/Simular Timeout/i)).toBeInTheDocument();
  });

  it('el enlace "Volver a mi perfil" redirige a /profile', async () => {
    render(<GraduateAffinityView />);

    const link = await screen.findByRole('link', { name: /Volver a mi perfil/i });
    expect(link).toHaveAttribute('href', '/profile');
  });

  it('dispara automáticamente el recálculo tras el debounce de 500 ms cuando hasPendingChanges es true', async () => {
    jest.useFakeTimers();

    const updatedAreas = recalculatedAreas.map((area) =>
      area.area === 'software-development' ? { ...area, affinity: 92 } : area
    );

    mockGetAffinityVector.mockResolvedValueOnce(
      makeVector(recalculatedAreas, { hasPendingChanges: true })
    );
    mockRecalculateAffinity.mockResolvedValueOnce(makeVector(updatedAreas));

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    expect(mockRecalculateAffinity).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(DEBOUNCE_MS - 1);
    });
    expect(mockRecalculateAffinity).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(mockRecalculateAffinity).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Radar actualizado')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('mantiene visible el radar previo con el estado "Actualizando tu afinidad…" durante el recálculo', async () => {
    let resolveRecalculate!: (value: unknown) => void;
    mockRecalculateAffinity.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRecalculate = resolve;
        })
    );

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    await clickSimulateProfileChange();

    expect(screen.getByText('Actualizando tu afinidad…')).toBeInTheDocument();
    expect(screen.getByTestId('radar')).toBeInTheDocument();

    await act(async () => {
      resolveRecalculate(makeVector());
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Actualizando tu afinidad…')
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('Radar actualizado')).toBeInTheDocument();
  });

  it('muestra "No se pudo actualizar tu radar" con "Reintentar" a los 7 s de timeout conservando el radar válido y permite reintentar', async () => {
    jest.useFakeTimers();

    mockRecalculateAffinity.mockImplementationOnce(() => new Promise(() => {}));

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    await clickSimulateProfileChange();

    expect(screen.getByText('Actualizando tu afinidad…')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(7000);
    });

    expect(
      await screen.findByText('No se pudo actualizar tu radar')
    ).toBeInTheDocument();
    expect(screen.getByTestId('radar')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    expect(retryButton).toBeInTheDocument();

    const recoveredAreas = recalculatedAreas.map((area) =>
      area.area === 'software-development' ? { ...area, affinity: 89 } : area
    );
    mockRecalculateAffinity.mockResolvedValueOnce(makeVector(recoveredAreas));

    await act(async () => {
      fireEvent.click(retryButton);
    });

    await waitFor(() => {
      expect(
        screen.queryByText('No se pudo actualizar tu radar')
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('Radar actualizado')).toBeInTheDocument();
    expect(screen.getByText('89%')).toBeInTheDocument();
  });

  it('descarta respuestas tardías si se lanza un nuevo recálculo antes de que finalice el anterior', async () => {
    let resolveFirst!: (value: unknown) => void;
    let resolveSecond!: (value: unknown) => void;

    mockRecalculateAffinity
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          })
      );

    const staleAreas = recalculatedAreas.map((area) =>
      area.area === 'software-development' ? { ...area, affinity: 61 } : area
    );
    const freshAreas = recalculatedAreas.map((area) =>
      area.area === 'software-development' ? { ...area, affinity: 94 } : area
    );

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    await clickSimulateProfileChange();
    await clickSimulateProfileChange();

    expect(mockRecalculateAffinity).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveSecond(makeVector(freshAreas));
    });

    await waitFor(() => {
      expect(screen.getByText('94%')).toBeInTheDocument();
    });

    await act(async () => {
      resolveFirst(makeVector(staleAreas));
    });

    expect(screen.getByText('94%')).toBeInTheDocument();
    expect(screen.queryByText('61%')).not.toBeInTheDocument();
  });

  it('oculta los controles de simulación cuando NEXT_PUBLIC_ENABLE_SIMULATION_CONTROLS está en false', async () => {
    process.env.NEXT_PUBLIC_ENABLE_SIMULATION_CONTROLS = 'false';

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    expect(screen.queryByRole('button', { name: /Simular Actualización/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Simular Timeout/i)).not.toBeInTheDocument();
  });

  it('muestra el estado vacío cuando el vector tiene áreas pero todas con afinidad cero y sin evidencias', async () => {
    const zeroAreas = recalculatedAreas.map((area) => ({
      ...area,
      affinity: 0,
      evidence: [],
      keywords: [],
    }));

    mockGetAffinityVector.mockResolvedValueOnce(makeVector(zeroAreas));

    render(<GraduateAffinityView />);

    expect(await screen.findByText(/Completar perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/Aún no podemos calcular tus áreas de mayor afinidad/i)).toBeInTheDocument();
    expect(screen.queryByText(/Última actualización/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Áreas con mayor afinidad identificadas:/i)).not.toBeInTheDocument();
  });

  it('ordena el resumen de mayor a menor afinidad en las áreas identificadas', async () => {
    const unorderedAreas = [
      {
        area: 'cybersecurity-networks',
        affinity: 40,
        keywords: [],
        evidence: evidence.cybersecurity,
      },
      {
        area: 'quality-assurance',
        affinity: 90,
        keywords: [],
        evidence: evidence.qa,
      },
      {
        area: 'data-ai',
        affinity: 75,
        keywords: [],
        evidence: evidence.data,
      },
      {
        area: 'cloud-devops',
        affinity: 60,
        keywords: [],
        evidence: evidence.cloud,
      },
      {
        area: 'software-development',
        affinity: 30,
        keywords: [],
        evidence: evidence.software,
      },
      {
        area: 'it-management',
        affinity: 20,
        keywords: [],
        evidence: evidence.management,
      },
    ];

    mockGetAffinityVector.mockResolvedValueOnce(makeVector(unorderedAreas));

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    const topSection = await screen.findByText(/Áreas con mayor afinidad identificadas:/i);
    expect(topSection).toBeInTheDocument();

    const badges = screen.getAllByText(/^\d+\.\s+/);
    expect(badges).toHaveLength(3);
    // 1ro: QA (90%)
    expect(badges[0]).toHaveTextContent(/Aseguramiento de Calidad \(QA\)/);
    expect(badges[0]).toHaveTextContent(/90%/);
    // 2do: Data/IA (75%)
    expect(badges[1]).toHaveTextContent(/Ciencia de Datos & IA/);
    expect(badges[1]).toHaveTextContent(/75%/);
    // 3ro: Cloud (60%)
    expect(badges[2]).toHaveTextContent(/Cloud, DevOps/);
    expect(badges[2]).toHaveTextContent(/60%/);
  });

  it('muestra +8 % y −3 % en las barras del resumen con afinidad previa', async () => {
    const areas = recalculatedAreas.map((area) => {
      if (area.area === 'software-development') {
        return { ...area, affinity: 83, previousAffinity: 75 };
      }
      if (area.area === 'cloud-devops') {
        return { ...area, affinity: 61, previousAffinity: 64 };
      }
      return { ...area, previousAffinity: null };
    });

    mockGetAffinityVector.mockResolvedValueOnce(makeVector(areas));

    render(<GraduateAffinityView />);

    const summary = await getSummaryPanel();

    expect(within(summary).getByText('83%')).toBeInTheDocument();
    expect(within(summary).getByText('+8 %')).toBeInTheDocument();
    expect(
      within(summary).getByRole('img', {
        name: 'Desarrollo de Software: subió 8 puntos porcentuales respecto al cálculo anterior',
      }),
    ).toBeInTheDocument();

    expect(within(summary).getByText('61%')).toBeInTheDocument();
    expect(within(summary).getByText('−3 %')).toBeInTheDocument();
    expect(
      within(summary).getByRole('img', {
        name: 'Cloud, DevOps & Infraestructura: bajó 3 puntos porcentuales respecto al cálculo anterior',
      }),
    ).toBeInTheDocument();
  });

  it('no muestra indicadores de variación en el primer cálculo', async () => {
    mockGetAffinityVector.mockResolvedValueOnce(makeVector());

    render(<GraduateAffinityView />);

    const summary = await getSummaryPanel();

    expect(within(summary).queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('muestra la variación en los chips de áreas con mayor afinidad', async () => {
    const areas = recalculatedAreas.map((area) => {
      if (area.area === 'software-development') {
        return { ...area, affinity: 83, previousAffinity: 75 };
      }
      return { ...area, previousAffinity: null };
    });

    mockGetAffinityVector.mockResolvedValueOnce(makeVector(areas));

    render(<GraduateAffinityView />);

    const heading = await screen.findByText(/Áreas con mayor afinidad identificadas:/i);
    const topSection = heading.closest('.bg-palladian') as HTMLElement;

    expect(
      within(topSection).getByText('1. Desarrollo de Software (83%)'),
    ).toBeInTheDocument();
    expect(within(topSection).getByText('+8 %')).toBeInTheDocument();
    expect(
      within(topSection).getByRole('img', {
        name: 'Desarrollo de Software: subió 8 puntos porcentuales respecto al cálculo anterior',
      }),
    ).toBeInTheDocument();
  });

  it('conserva la variación de las barras cuando el servidor devuelve recalculated false', async () => {
    const initialAreas = recalculatedAreas.map((area) => {
      if (area.area === 'software-development') {
        return { ...area, affinity: 83, previousAffinity: 75 };
      }
      return { ...area, previousAffinity: null };
    });
    const noRecalculatedAreas = recalculatedAreas.map((area) => {
      if (area.area === 'software-development') {
        return { ...area, affinity: 90, previousAffinity: 83 };
      }
      return { ...area, previousAffinity: null };
    });

    mockGetAffinityVector.mockResolvedValueOnce(makeVector(initialAreas));
    mockRecalculateAffinity.mockResolvedValueOnce({
      ...makeVector(noRecalculatedAreas),
      recalculated: false,
    });

    render(<GraduateAffinityView />);

    const summary = await getSummaryPanel();
    expect(within(summary).getByText('+8 %')).toBeInTheDocument();

    await clickSimulateProfileChange();

    await waitFor(() => {
      expect(mockRecalculateAffinity).toHaveBeenCalledTimes(1);
    });

    // Se conserva la referencia anterior: 83% con +8 % y no el 90% del servidor
    expect(within(summary).getByText('83%')).toBeInTheDocument();
    expect(within(summary).getByText('+8 %')).toBeInTheDocument();
    expect(within(summary).queryByText('90%')).not.toBeInTheDocument();
  });

  it('resalta solo los ejes cuyo porcentaje entero cambió tras recalcular', async () => {
    const initialAreas = recalculatedAreas.map((area) => {
      if (area.area === 'software-development') {
        return { ...area, affinity: 85.4 };
      }
      return area;
    });
    const nextAreas = recalculatedAreas.map((area) => {
      if (area.area === 'software-development') {
        return { ...area, affinity: 85.2 };
      }
      if (area.area === 'cloud-devops') {
        return { ...area, affinity: 66.2 };
      }
      return area;
    });

    mockGetAffinityVector.mockResolvedValueOnce(makeVector(initialAreas));
    mockRecalculateAffinity.mockResolvedValueOnce(makeVector(nextAreas));

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    await clickSimulateProfileChange();

    await waitFor(() => {
      expect(screen.getByTestId('radar')).toHaveAttribute(
        'data-changed',
        JSON.stringify(['cloud-devops']),
      );
    });
  });
});
