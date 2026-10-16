import React from 'react';
import { render, screen } from '@testing-library/react';
import { AffinitySiteHeader } from './affinity-site-header';

describe('AffinitySiteHeader', () => {
  it('ya no muestra las opciones de "Modo Buscador" ni "Modo Titulado"', () => {
    render(<AffinitySiteHeader />);

    expect(screen.queryByText(/modo buscador/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/modo titulado/i)).not.toBeInTheDocument();
  });

  it('renderiza la marca UMSSPIRA y enlaces de navegación', () => {
    render(<AffinitySiteHeader />);

    expect(screen.getByText('UMSSPIRA')).toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Bolsa de trabajo')).toBeInTheDocument();
  });
});
