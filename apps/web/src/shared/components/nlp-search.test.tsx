import React from 'react';
import { render, screen } from '@testing-library/react';
import { NlpSearch } from './nlp-search';

describe('NlpSearch', () => {
  const baseProps = {
    onSearchCompleted: jest.fn(),
    isSearching: false,
    setIsSearching: jest.fn(),
  };

  it('muestra el total de titulados recibido por props', () => {
    render(<NlpSearch {...baseProps} totalCandidates={8} />);

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('TITULADOS')).toBeInTheDocument();
  });

  it('muestra 0 cuando no hay candidatos cargados', () => {
    render(<NlpSearch {...baseProps} totalCandidates={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});