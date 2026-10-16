import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvidenceBreakdown } from './evidence-breakdown';

describe('EvidenceBreakdown', () => {
  const mockCandidate = {
    graduateId: 'cand-01',
    name: 'Ana Sofía Gutiérrez',
    career: 'Ingeniería de Sistemas',
    graduationYear: 2023,
    areas: [
      { area: 'desarrollo de software', affinity: 70 },
      { area: 'aseguramiento de calidad (QA)', affinity: 98 },
      { area: 'ciencia de datos & ia', affinity: 38 },
    ],
  };

  it('renderiza el nombre del candidato en el título del expediente', () => {
    render(<EvidenceBreakdown candidateName={mockCandidate.name} candidateData={mockCandidate} />);

    expect(screen.getByText('Ana Sofía Gutiérrez')).toBeInTheDocument();
    expect(screen.getByText(/EXPEDIENTE ACADÉMICO/i)).toBeInTheDocument();
  });

  it('calcula los porcentajes de afinidad de las pestañas dinámicamente según candidateData.areas', () => {
    render(<EvidenceBreakdown candidateName={mockCandidate.name} candidateData={mockCandidate} />);

    // QA tiene 98% en mockCandidate
    expect(screen.getByText('98%')).toBeInTheDocument();
    // Desarrollo de Software tiene 70% (aparece en la pestaña y en el resumen activo)
    expect(screen.getAllByText('70%').length).toBeGreaterThanOrEqual(1);
  });

  it('muestra respaldos reales y estructurados sin campos vacíos ni undefined', () => {
    render(<EvidenceBreakdown candidateName={mockCandidate.name} candidateData={mockCandidate} />);

    // Por defecto inicia en Desarrollo de Software
    expect(screen.getByText('TÍTULO EN PROVISIÓN NACIONAL')).toBeInTheDocument();
    expect(screen.getByText(/Licenciatura en/i)).toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('permite cambiar de área y muestra los respaldos del área seleccionada', () => {
    render(<EvidenceBreakdown candidateName={mockCandidate.name} candidateData={mockCandidate} />);

    const qaTab = screen.getByRole('button', { name: /Aseguramiento de Calidad \(QA\)/i });
    fireEvent.click(qaTab);

    expect(screen.getByText('ISTQB Foundation Level Test Automation')).toBeInTheDocument();
    expect(screen.getByText('CERTIFICACIÓN QA')).toBeInTheDocument();
  });
});
