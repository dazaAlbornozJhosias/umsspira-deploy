
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

const makeVector = (areas = recalculatedAreas) => ({
  graduateId: 'id-1',
  calculatedAt: '2026-09-30T12:00:00.000Z',
  hasLaborHistory: true,
  areas,
});

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

  beforeEach(() => {
    jest.clearAllMocks();

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

  it('no destaca áreas sin evidencias y les asigna afinidad cero', async () => {
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

    // Aunque el dato recibido diga 95, la regla del componente
    // debe convertir a cero las áreas que no tienen evidencias.
    expect(screen.getByText('1. Desarrollo de Software (85%)')).toBeInTheDocument();
    expect(screen.getByText('2. Ciencia de Datos & IA (71%)')).toBeInTheDocument();
    expect(
      screen.getByText('3. Cloud, DevOps & Infraestructura (64%)')
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/Ciberseguridad & Redes \(\d+%\)/)
    ).not.toBeInTheDocument();
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

    expect(screen.getByText('Ponderación: 4')).toBeInTheDocument();
    expect(mockGetAffinityConfig).toHaveBeenCalledTimes(1);
  });

  it('muestra el estado vacío con "Completar perfil" y oculta el indicador de actualización cuando no hay datos', async () => {
    // 1. Simulamos que el backend responde con un vector vacío
    mockGetAffinityVector.mockResolvedValueOnce({ areas: [] });

    render(<GraduateAffinityView />);

    // 2. Esperamos a que la vista cargue y muestre el botón de completar perfil
    expect(await screen.findByText(/Completar perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/Aún no podemos calcular tus áreas de mayor afinidad/i)).toBeInTheDocument();

    // 3. Verificamos que los indicadores de un radar válido NO estén en pantalla
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
});