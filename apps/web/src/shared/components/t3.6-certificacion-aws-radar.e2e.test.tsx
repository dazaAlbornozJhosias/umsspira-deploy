import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useEffect, useState } from 'react';

import { AcordeonPerfil } from '@/modules/profile/completar/acordeon-perfil';
import * as perfilApi from '@/modules/profile/services/perfil-api';
import { ProfileStoreProvider } from '@/modules/profile/state/profile-store';
import type { CertificationRecord } from '@/modules/profile/types/profile-record';
import { GraduateAffinityView } from '@/shared/components/graduate-affinity-view';
import { DEBOUNCE_MS } from '@/shared/hooks/use-debounced-batch';
import * as affinityService from '@/shared/services/affinity-service';

// Mock del router de Next.js
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock del radar gráfico para entorno jsdom
jest.mock('@/shared/components/affinity-radar', () => ({
  __esModule: true,
  default: (props: {
    affinityData?: Array<{ area: string; affinity: number }>;
    changedAreaIds?: string[];
    onSelectArea?: (id: string | null) => void;
  }) => (
    <div
      data-testid="radar"
      data-changed={JSON.stringify(props.changedAreaIds ?? [])}
      data-values={JSON.stringify(props.affinityData ?? [])}
    >
      <button
        type="button"
        onClick={() => props.onSelectArea?.('cloud-devops')}
      >
        Seleccionar Cloud
      </button>
    </div>
  ),
}));

// Mock del servicio de la Épica 2 (Perfil)
jest.mock('@/modules/profile/services/perfil-api', () => ({
  ...jest.requireActual('@/modules/profile/services/perfil-api'),
  crearCertificacion: jest.fn(),
  subirRespaldo: jest.fn(),
}));

// Mock del servicio de la Épica 3 (Afinidad / Radar)
jest.mock('@/shared/services/affinity-service', () => ({
  ...jest.requireActual('@/shared/services/affinity-service'),
  getAffinityVector: jest.fn(),
  recalculateAffinity: jest.fn(),
}));

const mockCrearCertificacion = perfilApi.crearCertificacion as jest.Mock;
const mockSubirRespaldo = perfilApi.subirRespaldo as jest.Mock;
const mockGetAffinityVector = affinityService.getAffinityVector as jest.Mock;
const mockRecalculateAffinity = affinityService.recalculateAffinity as jest.Mock;

const AWS_CERT_CREADA: CertificationRecord = {
  id: 'cert-aws-101',
  ownerId: 'titulado-1',
  name: 'AWS Certified Solutions Architect - Associate',
  issuer: 'Amazon Web Services',
  issueYear: '2024',
  degree: 'Certificación',
  backupVerified: false,
};

const initialAreas = [
  {
    area: 'software-development',
    affinity: 85,
    keywords: ['React', 'Node.js'],
    evidence: [{ type: 'certification', title: 'React Professional', detail: 'Meta' }],
  },
  {
    area: 'cloud-devops',
    affinity: 60,
    keywords: ['Docker'],
    evidence: [{ type: 'project', title: 'Docker Containers', detail: 'Infra' }],
  },
  {
    area: 'data-ai',
    affinity: 70,
    keywords: ['Python'],
    evidence: [{ type: 'certification', title: 'Python for Data', detail: 'Coursera' }],
  },
  {
    area: 'quality-assurance',
    affinity: 50,
    keywords: ['Jest'],
    evidence: [{ type: 'project', title: 'QA Suite', detail: 'Jest' }],
  },
  {
    area: 'cybersecurity-networks',
    affinity: 40,
    keywords: ['Redes'],
    evidence: [{ type: 'project', title: 'Network Config', detail: 'Cisco' }],
  },
  {
    area: 'it-management',
    affinity: 35,
    keywords: ['Scrum'],
    evidence: [{ type: 'project', title: 'Scrum Master', detail: 'Agile' }],
  },
];

const updatedAreasWithAWS = [
  {
    area: 'software-development',
    affinity: 85,
    keywords: ['React', 'Node.js'],
    evidence: [{ type: 'certification', title: 'React Professional', detail: 'Meta' }],
  },
  {
    area: 'cloud-devops',
    affinity: 92,
    keywords: ['AWS', 'Docker'],
    evidence: [
      {
        type: 'certification',
        title: 'AWS Certified Solutions Architect - Associate',
        detail: 'Amazon Web Services',
      },
    ],
  },
  {
    area: 'data-ai',
    affinity: 70,
    keywords: ['Python'],
    evidence: [{ type: 'certification', title: 'Python for Data', detail: 'Coursera' }],
  },
  {
    area: 'quality-assurance',
    affinity: 50,
    keywords: ['Jest'],
    evidence: [{ type: 'project', title: 'QA Suite', detail: 'Jest' }],
  },
  {
    area: 'cybersecurity-networks',
    affinity: 40,
    keywords: ['Redes'],
    evidence: [{ type: 'project', title: 'Network Config', detail: 'Cisco' }],
  },
  {
    area: 'it-management',
    affinity: 35,
    keywords: ['Scrum'],
    evidence: [{ type: 'project', title: 'Scrum Master', detail: 'Agile' }],
  },
];

const initialVector = {
  graduateId: 'titulado-1',
  calculatedAt: '2026-10-20T10:00:00.000Z',
  hasLaborHistory: true,
  areas: initialAreas,
};

const updatedVector = {
  graduateId: 'titulado-1',
  calculatedAt: '2026-10-26T22:30:00.000Z',
  hasLaborHistory: true,
  areas: updatedAreasWithAWS,
};

/**
 * Contenedor integrado para simular el viaje completo de usuario:
 * Mi Afinidad -> Añadir certificaciones -> Épica 2 (Completar Perfil) -> Ver mi afinidad -> Radar actualizado
 */
function IntegratedAffinityCertificationFlow({
  onNavigate,
}: {
  onNavigate?: (route: string) => void;
}) {
  const [route, setRoute] = useState<string>('/afinidad');

  useEffect(() => {
    mockPush.mockImplementation((targetPath: string) => {
      onNavigate?.(targetPath);
      if (targetPath.includes('/epica-2/certificaciones/nueva')) {
        setRoute('/profile/completar?returnTo=/afinidad');
      } else {
        setRoute(targetPath);
      }
    });
  }, [onNavigate]);

  const handleContainerClick = (e: React.MouseEvent) => {
    const link = (e.target as HTMLElement).closest('a');
    if (link && link.getAttribute('href') === '/afinidad') {
      e.preventDefault();
      onNavigate?.('/afinidad');
      setRoute('/afinidad');
    }
  };

  return (
    <div onClick={handleContainerClick}>
      <ProfileStoreProvider initialRecords={{ education: [], experience: [], certification: [] }}>
        {route === '/afinidad' && (
          <div data-testid="view-affinity">
            <GraduateAffinityView />
          </div>
        )}

        {route.startsWith('/profile/completar') && (
          <div data-testid="view-complete-profile">
            <AcordeonPerfil
              returnTo="/afinidad"
              seccionInicial="certificaciones"
            />
          </div>
        )}
      </ProfileStoreProvider>
    </div>
  );
}

describe('T3.6 · E2E: agregar certificación AWS en la Épica 2 -> volver a «Mi afinidad» -> radar actualizado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubirRespaldo.mockResolvedValue(undefined);
    mockCrearCertificacion.mockResolvedValue(AWS_CERT_CREADA);
    mockGetAffinityVector.mockResolvedValue(initialVector);
    mockRecalculateAffinity.mockResolvedValue(updatedVector);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Paso 1: en «Mi afinidad», el botón «Añadir certificaciones» redirige hacia la Épica 2 con returnTo=/afinidad', async () => {
    render(<GraduateAffinityView />);

    const addButton = await screen.findByRole('button', {
      name: /añadir certificaciones/i,
    });
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);

    expect(mockPush).toHaveBeenCalledWith('/epica-2/certificaciones/nueva?returnTo=/afinidad');
  });

  it('Paso 2 y 3: en la Épica 2, llena y guarda la certificación AWS mockeando crearCertificacion y muestra el enlace de retorno', async () => {
    render(
      <ProfileStoreProvider initialRecords={{ education: [], experience: [], certification: [] }}>
        <AcordeonPerfil returnTo="/afinidad" seccionInicial="certificaciones" />
      </ProfileStoreProvider>
    );

    // Llenar datos de la certificación AWS
    fireEvent.change(screen.getByLabelText('Nombre de certificación'), {
      target: { value: 'AWS Certified Solutions Architect - Associate' },
    });
    fireEvent.change(screen.getByLabelText('Entidad emisora'), {
      target: { value: 'Amazon Web Services' },
    });
    fireEvent.change(screen.getByLabelText('Año'), {
      target: { value: '2024' },
    });

    const file = new File(['cert content'], 'aws-cert.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Subir foto', { selector: 'input' }), {
      target: { files: [file] },
    });

    // Guardar
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar certificación/i }));
    });

    // Verifica que se invocó crearCertificacion con los datos esperados
    await waitFor(() => {
      expect(mockCrearCertificacion).toHaveBeenCalledTimes(1);
    });

    expect(mockCrearCertificacion).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'AWS Certified Solutions Architect - Associate',
        entidadEmisora: 'Amazon Web Services',
        anioEmision: '2024',
      })
    );

    // Confirmación y enlace de regreso
    expect(await screen.findByText('Certificación guardada')).toBeInTheDocument();
    expect(screen.getByText('AWS Certified Solutions Architect - Associate')).toBeInTheDocument();

    const returnLink = screen.getByRole('link', { name: 'Ver mi afinidad →' });
    expect(returnLink).toBeInTheDocument();
    expect(returnLink).toHaveAttribute('href', '/afinidad');
  });

  it('Paso 4: al volver a «Mi afinidad», dispara el recálculo y muestra el toast «Radar actualizado» con los datos de AWS', async () => {
    // Al volver, el vector inicial tiene hasPendingChanges: true para gatillar el recálculo
    mockGetAffinityVector.mockResolvedValueOnce({
      ...initialVector,
      hasPendingChanges: true,
    });
    mockRecalculateAffinity.mockResolvedValueOnce(updatedVector);

    jest.useFakeTimers();

    render(<GraduateAffinityView />);

    await screen.findByText('Resumen de tu afinidad');

    // Avanza el debounce de 500ms para que se ejecute el recálculo
    await act(async () => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    await waitFor(() => {
      expect(mockRecalculateAffinity).toHaveBeenCalledTimes(1);
    });

    // Notificación de éxito
    expect(await screen.findByText('Radar actualizado')).toBeInTheDocument();

    // El porcentaje de Cloud & DevOps ahora es 92%
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('Flujo E2E completo: Mi afinidad -> Añadir certificaciones -> Llenar AWS en Épica 2 -> Guardar -> Ver mi afinidad -> Radar actualizado', async () => {
    // Primera carga en afinidad
    mockGetAffinityVector
      .mockResolvedValueOnce(initialVector)
      // Segunda carga al regresar de completar perfil (con cambios pendientes)
      .mockResolvedValueOnce({
        ...initialVector,
        hasPendingChanges: true,
      });

    mockRecalculateAffinity.mockResolvedValue(updatedVector);

    jest.useFakeTimers();

    render(<IntegratedAffinityCertificationFlow />);

    // 1. Inicia en Mi afinidad
    expect(await screen.findByTestId('view-affinity')).toBeInTheDocument();
    expect(await screen.findByText('Resumen de tu afinidad')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument(); // Cloud inicial

    // 2. Clic en "Añadir certificaciones"
    const addCertBtn = screen.getByRole('button', { name: /añadir certificaciones/i });
    fireEvent.click(addCertBtn);

    // Verifica navegación solicitada a la ruta de Épica 2
    expect(mockPush).toHaveBeenCalledWith('/epica-2/certificaciones/nueva?returnTo=/afinidad');

    // 3. Ahora estamos en el formulario de la Épica 2
    expect(await screen.findByTestId('view-complete-profile')).toBeInTheDocument();

    // 4. Llenar formulario con la certificación AWS
    fireEvent.change(screen.getByLabelText('Nombre de certificación'), {
      target: { value: 'AWS Certified Solutions Architect - Associate' },
    });
    fireEvent.change(screen.getByLabelText('Entidad emisora'), {
      target: { value: 'Amazon Web Services' },
    });
    fireEvent.change(screen.getByLabelText('Año'), {
      target: { value: '2024' },
    });

    const file = new File(['cert content'], 'aws.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Subir foto', { selector: 'input' }), {
      target: { files: [file] },
    });

    // 5. Guardar la certificación
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /agregar certificación/i }));
    });

    await waitFor(() => {
      expect(mockCrearCertificacion).toHaveBeenCalledTimes(1);
    });

    // 6. Aparece "Certificación guardada" y el enlace "Ver mi afinidad →"
    expect(await screen.findByText('Certificación guardada')).toBeInTheDocument();
    const returnLink = screen.getByRole('link', { name: 'Ver mi afinidad →' });
    expect(returnLink).toBeInTheDocument();

    // 7. Clic en "Ver mi afinidad →" para regresar
    await act(async () => {
      fireEvent.click(returnLink);
    });

    // 8. De vuelta en Mi afinidad
    expect(await screen.findByTestId('view-affinity')).toBeInTheDocument();
    expect(await screen.findByText('Resumen de tu afinidad')).toBeInTheDocument();

    // 9. Se dispara el debounce de recálculo
    await act(async () => {
      jest.advanceTimersByTime(DEBOUNCE_MS);
    });

    await waitFor(() => {
      expect(mockRecalculateAffinity).toHaveBeenCalledTimes(1);
    });

    // 10. Radar actualizado visible con el toast y el nuevo porcentaje de 92%
    expect(await screen.findByText('Radar actualizado')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });
});
