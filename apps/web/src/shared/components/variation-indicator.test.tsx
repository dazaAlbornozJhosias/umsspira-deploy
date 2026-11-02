import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VariationIndicator } from './variation-indicator';

describe('VariationIndicator', () => {
  it('muestra el indicador positivo con signo, flecha y texto accesible', () => {
    render(<VariationIndicator current={83} previous={75} areaLabel="Desarrollo de Software" />);

    expect(screen.getByText('+8 %')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Desarrollo de Software: subió 8 puntos porcentuales respecto al cálculo anterior',
      }),
    ).toBeInTheDocument();
  });

  it('muestra el indicador negativo con el signo menos tipográfico', () => {
    render(<VariationIndicator current={42} previous={45} areaLabel="Aseguramiento de Calidad (QA)" />);

    expect(screen.getByText('\u22123 %')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Aseguramiento de Calidad (QA): bajó 3 puntos porcentuales respecto al cálculo anterior',
      }),
    ).toBeInTheDocument();
  });

  it('usa el singular cuando la variación es de un punto', () => {
    render(<VariationIndicator current={51} previous={50} areaLabel="Cloud, DevOps & Infraestructura" />);

    expect(
      screen.getByRole('img', {
        name: 'Cloud, DevOps & Infraestructura: subió 1 punto porcentual respecto al cálculo anterior',
      }),
    ).toBeInTheDocument();
  });

  it('no renderiza nada en el primer cálculo', () => {
    const { container } = render(
      <VariationIndicator current={83} previous={null} areaLabel="Desarrollo de Software" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('no renderiza nada cuando la variación redondeada es cero', () => {
    const { container } = render(
      <VariationIndicator current={40.2} previous={40.4} areaLabel="Ciencia de Datos & IA" />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('no renderiza nada cuando falta el valor actual', () => {
    const { container } = render(
      <VariationIndicator current={null} previous={50} areaLabel="Ciberseguridad & Redes" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('no renderiza nada cuando las afinidades son iguales', () => {
    const { container } = render(
      <VariationIndicator current={50} previous={50} areaLabel="Gestión de TI & Gobernanza" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('usa los tokens de chip y respeta prefers-reduced-motion', () => {
    render(<VariationIndicator current={83} previous={75} areaLabel="Desarrollo de Software" />);

    const indicator = screen.getByRole('img');
    expect(indicator).toHaveClass('rounded-full');
    expect(indicator).toHaveClass('bg-palladian');
    expect(indicator).toHaveClass('border-oatmeal');
    expect(indicator).toHaveClass('text-xs');
    expect(indicator).toHaveClass('font-medium');
    expect(indicator).toHaveClass('motion-safe:transition-opacity');
    expect(indicator).toHaveClass('motion-reduce:opacity-100');
  });

  it('distingue subida y bajada con colores distintos a los del texto neutro', () => {
    const { rerender } = render(
      <VariationIndicator current={83} previous={75} areaLabel="Desarrollo de Software" />,
    );
    expect(screen.getByRole('img')).toHaveClass('text-[#237044]');

    rerender(<VariationIndicator current={42} previous={45} areaLabel="Desarrollo de Software" />);
    expect(screen.getByRole('img')).toHaveClass('text-truffle-trouble');
  });
});
