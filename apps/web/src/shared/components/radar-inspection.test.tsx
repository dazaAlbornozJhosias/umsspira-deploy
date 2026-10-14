import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RadarInspection from './radar-inspection';

// Mock del JSON para controlar los escenarios de prueba
jest.mock('../mocks/affinity-vector-mock.json', () => ({
  areas: [
    {
      area: 'software-development',
      affinity: 85.6,
      evidence: [
        { type: 'certification', title: 'Certificado React Avanzado' },
        { type: 'project', title: 'Sistema de Gestión' }
      ]
    },
    {
      area: 'cloud-devops',
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
    expect(screen.getByText('Cloud/DevOps')).toBeInTheDocument();

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
    expect(screen.getByText('Área: Cloud/DevOps')).toBeInTheDocument();
  });

  test('C9: Muestra el mensaje adecuado cuando el área seleccionada no tiene respaldos asociados', () => {
    render(<RadarInspection selectedAreaId="cloud-devops" onSelectArea={mockOnSelectArea} />);

    // Como cloud-devops tiene evidence: [], debe mostrar los mensajes de ausencia de respaldos
    expect(screen.getAllByText(/No hay certificaciones registradas para esta área/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Esta área no tiene respaldos asociados/i)).toBeInTheDocument();
  });
});