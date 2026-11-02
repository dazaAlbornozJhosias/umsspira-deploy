import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AffinityRadar from './affinity-radar';
import type { AffinityAreaScore } from '@umsspira/shared-types/src/affinity';

// Mock de las funciones reales de porcentaje
jest.mock('../utils/percentage', () => ({
  clampPercentage: (val: number) => Math.min(Math.max(Math.round(val), 0), 100),
  formatPercentage: (val: number) => `${Math.min(Math.max(Math.round(val), 0), 100)}%`,
}));

const mockData = [
  { area: 'software-development', affinity: 85.5 }, // Debería redondear a 86%
  { area: 'cloud-devops', affinity: 70 },
  { area: 'data-ai', affinity: 90 },
  { area: 'quality-assurance', affinity: 60 },
  { area: 'cybersecurity-networks', affinity: 45 },
  { area: 'it-management', affinity: 80 },
];

describe('AffinityRadar Component', () => {
  // --- TUS TESTS ORIGINALES (Intactos) ---
  it('renderiza las 6 áreas en el orden fijo', () => {
    render(<AffinityRadar affinityData={mockData as any} hasData={true} />);

    expect(screen.getByText(/Desarrollo de Software/i)).toBeInTheDocument();
    expect(screen.getByText(/Cloud, DevOps & Infraestructura/i)).toBeInTheDocument();
    expect(screen.getByText(/Ciencia de Datos & IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Aseguramiento de Calidad \(QA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ciberseguridad & Redes/i)).toBeInTheDocument();
    expect(screen.getByText(/Gestión de TI & Gobernanza/i)).toBeInTheDocument();
  });

  it('muestra los detalles correctos al hacer clic en un área y reemplaza la selección', () => {
    render(<AffinityRadar affinityData={mockData as any} hasData={true} />);

    // Verificar estado inicial vacío
    expect(screen.getByText('Selecciona un área en el radar para ver el detalle de afinidad del titulado.')).toBeInTheDocument();

    // Clic en la primera área (Desarrollo de Software)
    const softwareDevLabel = screen.getByText(/Desarrollo de Software/i);
    fireEvent.click(softwareDevLabel);

    // Debe mostrar la etiqueta correcta y el porcentaje redondeado formateado
    expect(screen.getByText('ÁREA SELECCIONADA (CLICK)')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();

    // Clic en la segunda área (Cloud/DevOps)
    const cloudDevopsLabel = screen.getByText(/Cloud, DevOps & Infraestructura/i);
    fireEvent.click(cloudDevopsLabel);

    // Debe reemplazar el 86% anterior por el 70% de Cloud
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.queryByText('86%')).not.toBeInTheDocument();
  });

  // --- NUEVOS TESTS SOLICITADOS EN LA REVISIÓN ---
  it('no debe renderizar el polígono ni el panel inferior cuando hasData={false}', () => {
    const { container } = render(<AffinityRadar affinityData={mockData as any} hasData={false} />);

    // Verifica que NO exista el polígono de datos
    expect(container.querySelector('polygon.fill-blue-500\\/30')).not.toBeInTheDocument();
    // Verifica que NO exista el panel inferior interactivo
    expect(screen.queryByText(/ÁREA SELECCIONADA/i)).not.toBeInTheDocument();
    
    // Verifica que las etiquetas de los ejes sigan mostrándose (sin porcentajes, CA-HU2-05)
    expect(screen.getByText(/Desarrollo de Software/i)).toBeInTheDocument();
  });

  it('no debe renderizar el polígono ni el panel inferior cuando affinityData está vacío', () => {
    const { container } = render(<AffinityRadar affinityData={[]} hasData={true} />);

    expect(container.querySelector('polygon.fill-blue-500\\/30')).not.toBeInTheDocument();
    expect(screen.queryByText(/ÁREA SELECCIONADA/i)).not.toBeInTheDocument();
    
    // Los ejes base de la telaraña deben seguir ahí
    expect(screen.getByText(/Desarrollo de Software/i)).toBeInTheDocument();
  });

    // --- SELECCIÓN CONTROLADA DESDE EL PADRE ---
  it('en modo controlado marca el eje indicado por selectedAreaId', () => {
    render(<AffinityRadar affinityData={mockData as any} hasData={true} selectedAreaId="cloud-devops" />);

    expect(screen.getByText('ÁREA SELECCIONADA (CLICK)')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('en modo controlado avisa al padre con el id del eje y no cambia la selección por sí mismo', () => {
    const onSelectArea = jest.fn();
    render(
      <AffinityRadar
        affinityData={mockData as any}
        hasData={true}
        selectedAreaId={null}
        onSelectArea={onSelectArea}
      />
    );

    fireEvent.click(screen.getByText(/Cloud, DevOps & Infraestructura/i));
    
    expect(onSelectArea).toHaveBeenCalledWith('cloud-devops');
    expect(
      screen.getByText('Selecciona un área en el radar para ver el detalle de afinidad del titulado.')
    ).toBeInTheDocument();
    expect(screen.queryByText('70%')).not.toBeInTheDocument();
  });

  it('sin selectedAreaId mantiene su propia selección y también avisa al padre', () => {
    const onSelectArea = jest.fn();
    render(<AffinityRadar affinityData={mockData as any} hasData={true} onSelectArea={onSelectArea} />);

    fireEvent.click(screen.getByText(/Desarrollo de Software/i));

    expect(onSelectArea).toHaveBeenCalledWith('software-development');
    expect(screen.getByText('ÁREA SELECCIONADA (CLICK)')).toBeInTheDocument();
  });
  it('llama a onSelectArea cuando se hace clic sobre la línea del eje', () => {
    const handleSelectArea = jest.fn();
    const { container } = render(
      <AffinityRadar
        affinityData={mockData as any}
        hasData={true}
        onSelectArea={handleSelectArea}
      />
    );

    // Selecciona el primer eje por su línea interactiva
    const axisLine = container.querySelector('g.cursor-pointer line[stroke="transparent"]');
    expect(axisLine).toBeInTheDocument();

    if (axisLine) {
      fireEvent.click(axisLine);
      expect(handleSelectArea).toHaveBeenCalledWith('software-development');
    }
  });

  it('no muestra el panel de selección cuando hasData={false}', () => {
    render(<AffinityRadar affinityData={[]} hasData={false} />);

    expect(screen.queryByText(/ÁREA SELECCIONADA/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vector Calculado/i)).not.toBeInTheDocument();
  });

  it('muestra la variación en la etiqueta del eje cuando existe afinidad previa', () => {
    const data: AffinityAreaScore[] = [
      { area: 'software-development', affinity: 82.5, previousAffinity: 75 },
      { area: 'cloud-devops', affinity: 61, previousAffinity: 64 },
      { area: 'data-ai', affinity: 40.4, previousAffinity: 40.1 },
      { area: 'quality-assurance', affinity: 63, previousAffinity: 63 },
      { area: 'cybersecurity-networks', affinity: 18, previousAffinity: null },
      { area: 'it-management', affinity: 30, previousAffinity: 30 },
    ];

    render(<AffinityRadar affinityData={data} hasData={true} />);

    expect(screen.getByText('+8 %')).toBeInTheDocument();
    expect(screen.getByText('\u22123 %')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('no muestra indicador en el primer cálculo ni cuando el entero no cambia', () => {
    const data: AffinityAreaScore[] = [
      { area: 'software-development', affinity: 82.5, previousAffinity: null },
      { area: 'cloud-devops', affinity: 40.2, previousAffinity: 40.4 },
      { area: 'data-ai', affinity: 50, previousAffinity: 50 },
      { area: 'quality-assurance', affinity: 49.6, previousAffinity: 50.4 },
      { area: 'cybersecurity-networks', affinity: 18 },
      { area: 'it-management', affinity: 30, previousAffinity: 30 },
    ];

    render(<AffinityRadar affinityData={data} hasData={true} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('no muestra variación cuando la afinidad actual no es un número finito', () => {
    const data: AffinityAreaScore[] = [
      { area: 'software-development', affinity: Number.NaN, previousAffinity: 75 },
      { area: 'cloud-devops', affinity: Number.POSITIVE_INFINITY, previousAffinity: 64 },
    ];

    render(<AffinityRadar affinityData={data} hasData={true} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('resalta solo los ejes indicados como cambiados y conserva la transición del polígono', () => {
    const { container } = render(
      <AffinityRadar
        affinityData={mockData as any}
        hasData={true}
        changedAreaIds={['cloud-devops']}
      />
    );

    expect(container.querySelectorAll('circle.stroke-amber-600')).toHaveLength(1);
    expect(container.querySelector('polygon.stroke-red-800\\/60')?.getAttribute('class')).toContain(
      'transition-all',
    );
  });
});

// Para el radar miniatura
describe('AffinityRadar variante mini', () => {
  it('no muestra el panel de area seleccionada', () => {
    render(<AffinityRadar affinityData={mockData as any} variant="mini" />);

    expect(screen.queryByText('ÁREA SELECCIONADA (CLICK)')).not.toBeInTheDocument();
  });

  it('muestra etiquetas cortas con porcentaje', () => {
    render(<AffinityRadar affinityData={mockData as any} variant="mini" />);

    expect(screen.getByText('Desarrollo de Software (86%)')).toBeInTheDocument();
    expect(screen.getByText('Cloud/Devops (70%)')).toBeInTheDocument();
    expect(screen.getByText('Ciencia de Datos/IA (90%)')).toBeInTheDocument();
    expect(screen.getByText('QA (60%)')).toBeInTheDocument();
    expect(screen.getByText('Ciberseguridad (45%)')).toBeInTheDocument();
    expect(screen.getByText('Gestión TI (80%)')).toBeInTheDocument();
  });

  it('es de solo lectura: no responde a clics', () => {
    const { container } = render(
      <AffinityRadar affinityData={mockData as any} variant="mini" />
    );

    expect(container.querySelector('.cursor-pointer')).toBeNull();

    fireEvent.click(screen.getByText('Desarrollo de Software (86%)'));
    expect(screen.queryByText('ÁREA SELECCIONADA (CLICK)')).not.toBeInTheDocument();
  });

  it('pinta el radar en rojo solo cuando esta destacado', () => {
    const { container, rerender } = render(
      <AffinityRadar affinityData={mockData as any} variant="mini" />
    );
    expect(container.querySelector('polygon.stroke-red-700')).toBeNull();

    rerender(<AffinityRadar affinityData={mockData as any} variant="mini" highlighted />);
    expect(container.querySelector('polygon.stroke-red-700')).not.toBeNull();
  });

  it('en estado vacío muestra solo la cuadrícula, sin polígono ni porcentajes', () => {
    const expectOnlyGrid = (container: HTMLElement) => {
      // Solo los 5 polígonos de la cuadrícula, ninguno de datos
      expect(container.querySelectorAll('polygon')).toHaveLength(5);
      expect(container.querySelector('polygon.stroke-red-700')).toBeNull();
      expect(container.querySelector('polygon.stroke-slate-800')).toBeNull();
      // Sin vértices
      expect(container.querySelectorAll('circle')).toHaveLength(0);
      // Sin etiquetas ni porcentajes
      expect(container.querySelectorAll('text')).toHaveLength(0);
      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
      expect(screen.queryByText('ÁREA SELECCIONADA (CLICK)')).not.toBeInTheDocument();
    };

    // Caso 1: hasData en false (aunque haya datos)
    const { container, rerender } = render(
      <AffinityRadar affinityData={mockData as any} hasData={false} variant="mini" highlighted />
    );
    expectOnlyGrid(container);

    // Caso 2: affinityData vacío
    rerender(<AffinityRadar affinityData={[]} hasData={true} variant="mini" highlighted />);
    expectOnlyGrid(container);
  });
});