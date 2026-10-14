import React from 'react';
import { render, screen } from '@testing-library/react';
import { AffinitySummaryCard } from './affinity-summary-card';

describe('AffinitySummaryCard', () => {
  const mockTopAreas = [
    { id: 'software-development', label: 'Desarrollo de Software', score: 78 },
    { id: 'data-ai', label: 'Ciencia de Datos & IA', score: 72 },
  ];

  const mockKeywords = ['Python', 'React', 'Docker'];

  it('debe renderizar las áreas de mayor afinidad y las palabras clave recibidas por props', () => {
    render(<AffinitySummaryCard topAreas={mockTopAreas} keywords={mockKeywords} />);

    expect(screen.getByText(/1\. Desarrollo de Software \(78%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Ciencia de Datos & IA \(72%\)/i)).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
  });

  it('debe renderizar sin errores cuando no recibe datos', () => {
    render(<AffinitySummaryCard topAreas={[]} keywords={[]} />);

    expect(screen.getByText(/Áreas con mayor afinidad identificadas:/i)).toBeInTheDocument();
    expect(screen.getByText(/Palabras clave más influyentes:/i)).toBeInTheDocument();
  });
});