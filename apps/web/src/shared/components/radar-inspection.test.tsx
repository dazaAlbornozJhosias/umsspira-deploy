import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RadarInspection, { type AreaData } from './radar-inspection';

// Mock del JSON para controlar los escenarios de prueba
jest.mock('../mocks/affinity-vector-mock.json', () => ({
  areas: [
    {
      area: 'software-development',
      name: 'Desarrollo de Software',
      affinity: 85.6,
      evidence: [
        { type: 'certification', title: 'Certificado React Avanzado' },
        { type: 'project', title: 'Sistema de Gestión' }
      ]
    },
    {
      area: 'cloud-devops',
      name: 'Cloud/DevOps',
      affinity: 70,
      evidence: [] // Área sin respaldos (HU2-C9)
    }
  ]
}));

describe('RadarInspection Component', () => {
  const mockOnSelectArea = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('C2: Renderiza el estado vacío correctamente cuando no hay áreas', () => {
    // Pasamos un array vacío mediante la prop 'areas' para probar el estado vacío sin botones (CA-HU2-05)
    render(
      <RadarInspection 
        selectedAreaId={null} 
        onSelectArea={mockOnSelectArea} 
        areas={[]} 
      />
    );

    // Verificamos que se muestre el texto de estado vacío obligatorio
    expect(
      screen.getByText(/Sin datos de historial laboral/i)
    ).toBeInTheDocument();

    // Verificamos rigurosamente que NO se renderice ningún botón
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('C4, C6 & C3: Muestra las áreas con sus nombres oficiales, porcentajes enteros y permite seleccionar un área', () => {
    render(<RadarInspection selectedAreaId={null} onSelectArea={mockOnSelectArea} />);

    // Verifica que se muestre el texto de ayuda y los nombres de las áreas mapeadas
    expect(screen.getByText('Haz clic en un área para inspeccionar sus respaldos')).toBeInTheDocument();
    expect(screen.getByText('Desarrollo de Software')).toBeInTheDocument();
    expect(screen.getByText('Cloud, DevOps & Infraestructura')).toBeInTheDocument();

    // Verifica porcentaje entero (85.6% formateado o redondeado según tu utilidad)
    expect(screen.getByText(/86%/i)).toBeInTheDocument();

    // Simula clic en un área para verificar la prop onSelectArea
    fireEvent.click(screen.getByText('Desarrollo de Software'));
    expect(mockOnSelectArea).toHaveBeenCalledWith('software-development');
  });

  test('C4: Muestra únicamente los respaldos del área seleccionada', () => {
    render(<RadarInspection selectedAreaId="software-development" onSelectArea={mockOnSelectArea} />);

    // Debe mostrar los respaldos de desarrollo de software
    expect(screen.getByText('Certificado React Avanzado')).toBeInTheDocument();
    expect(screen.getByText('Sistema de Gestión')).toBeInTheDocument();
  });

  test('C5: Permite reemplazar la selección anterior enviando el nuevo ID o null al hacer clic', () => {
    const { rerender } = render(
      <RadarInspection selectedAreaId="software-development" onSelectArea={mockOnSelectArea} />
    );

    // Si hacemos clic en "Volver al resumen" o en otra área, se dispara la prop
    const backButton = screen.getByText(/Volver al resumen/i);
    fireEvent.click(backButton);
    expect(mockOnSelectArea).toHaveBeenCalledWith(null);

    // Simulamos cambio de selección por props
    rerender(<RadarInspection selectedAreaId="cloud-devops" onSelectArea={mockOnSelectArea} />);
    expect(screen.getByText('Área: Cloud, DevOps & Infraestructura')).toBeInTheDocument();
  });

  test('C9: Muestra el mensaje adecuado cuando el área seleccionada no tiene respaldos asociados', () => {
    render(<RadarInspection selectedAreaId="cloud-devops" onSelectArea={mockOnSelectArea} />);

    // Si no tiene evidencia: [], debe mostrar los mensajes de ausencia de respaldos
    expect(screen.getAllByText(/No hay certificaciones registradas para esta área/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Esta área no tiene respaldos asociados/i)).toBeInTheDocument();
  });
});

describe('RadarInspection - indicador de variación en las barras del resumen', () => {
  const mockOnSelectArea = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSummary = (areas: AreaData[], selectedAreaId: string | null = null) =>
    render(
      <RadarInspection
        selectedAreaId={selectedAreaId}
        onSelectArea={mockOnSelectArea}
        areas={areas}
      />
    );

  test('CA-HU8-07: muestra +8 % y −3 % junto al porcentaje de cada fila', () => {
    renderSummary([
      { area: 'software-development', affinity: 83, previousAffinity: 75 },
      { area: 'cloud-devops', affinity: 61, previousAffinity: 64 },
      { area: 'data-ai', affinity: 50, previousAffinity: 50 },
    ]);

    expect(screen.getByText('83%')).toBeInTheDocument();
    expect(screen.getByText('+8 %')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Desarrollo de Software: subió 8 puntos porcentuales respecto al cálculo anterior',
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('61%')).toBeInTheDocument();
    expect(screen.getByText('\u22123 %')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Cloud, DevOps & Infraestructura: bajó 3 puntos porcentuales respecto al cálculo anterior',
      }),
    ).toBeInTheDocument();

    // La fila sin cambio no recibe ninguna variación (CA-HU8-09)
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  test('CA-HU8-08: no muestra indicador en el primer cálculo, con previousAffinity null o ausente', () => {
    renderSummary([
      { area: 'software-development', affinity: 83, previousAffinity: null },
      { area: 'cloud-devops', affinity: 61 },
      { area: 'data-ai', affinity: 50, previousAffinity: 50 },
    ]);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
    expect(screen.getByText('61%')).toBeInTheDocument();
  });

  test('CA-HU8-09: no muestra indicador cuando la variación redondeada es cero', () => {
    renderSummary([
      { area: 'software-development', affinity: 49.6, previousAffinity: 50.4 },
      { area: 'cloud-devops', affinity: 50, previousAffinity: 50 },
    ]);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByText('50%')).toHaveLength(2);
  });

  test('T4.5: calcula la variación con los enteros mostrados, no con los decimales', () => {
    renderSummary([
      // 49,6 se muestra como 50% y 49,4 como 49%: la variación es +1 %
      { area: 'software-development', affinity: 49.6, previousAffinity: 49.4 },
      // 49,6 y 50,4 se muestran ambos como 50%: sin indicador
      { area: 'cloud-devops', affinity: 49.6, previousAffinity: 50.4 },
    ]);

    expect(screen.getByText('+1 %')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  test('CA-HU8-04 y CA-HU8-05: ordena de mayor a menor y conserva el área seleccionada', () => {
    renderSummary(
      [
        { area: 'software-development', affinity: 60 },
        { area: 'data-ai', affinity: 75 },
        { area: 'cloud-devops', affinity: 90 },
      ],
      'cloud-devops',
    );

    const highest = screen.getByText('90%');
    const middle = screen.getByText('75%');
    const lowest = screen.getByText('60%');

    expect(
      highest.compareDocumentPosition(middle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      middle.compareDocumentPosition(lowest) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // El reordenamiento no pierde el área seleccionada en el panel de respaldos
    expect(
      screen.getByText('Área: Cloud, DevOps & Infraestructura'),
    ).toBeInTheDocument();
  });
});