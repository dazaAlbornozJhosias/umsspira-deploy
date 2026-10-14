import React from 'react';
import { render, screen } from '@testing-library/react';
import { CandidateCard } from './candidate-card';

describe('CandidateCard Component (HU4)', () => {
  const mockCandidate = {
    graduateId: '00000000-0000-0000-0000-000000000001',
    name: 'Carlos Mendoza',
    career: 'Ingeniería de Sistemas',
    graduationYear: 2024,
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    professionalDescription: 'Desarrollador de software web.',
    affinity: 92.5,
    areas: [
      { area: 'desarrollo de software', affinity: 95 },
      { area: 'cloud & devops', affinity: 64 },
      { area: 'ciencia de datos & ia', affinity: 71 },
      { area: 'aseguramiento de calidad (QA)', affinity: 58 },
      { area: 'ciberseguridad y redes', affinity: 42 },
      { area: 'gestion de ti & gobernanza', affinity: 50 },
    ],
  };

  it('renders "Ver Detalle" button instead of "Ver Perfil"', () => {
    render(<CandidateCard {...mockCandidate} />);

    expect(screen.getByText('Ver Detalle')).toBeInTheDocument();
    expect(screen.queryByText('Ver Perfil')).not.toBeInTheDocument();
  });

});
