import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentTypeSelect } from './document-type-select';

describe('DocumentTypeSelect Component', () => {
  it('debe renderizar las 3 opciones de documentos oficiales', () => {
    const onChangeMock = jest.fn();
    render(<DocumentTypeSelect value={null} onChange={onChangeMock} />);

    expect(screen.getByText('Título en Provisión Nal.')).toBeInTheDocument();
    expect(screen.getByText('Diploma Académico')).toBeInTheDocument();
    expect(screen.getByText('Certificado de Egreso')).toBeInTheDocument();
  });

  it('debe llamar a onChange con el valor correcto al hacer clic en una opción', () => {
    const onChangeMock = jest.fn();
    render(<DocumentTypeSelect value={null} onChange={onChangeMock} />);

    const diplomaBtn = screen.getByRole('radio', { name: /diploma académico/i });
    fireEvent.click(diplomaBtn);

    expect(onChangeMock).toHaveBeenCalledWith('diploma_academico');
  });

  it('debe marcar aria-checked en la opción seleccionada', () => {
    render(<DocumentTypeSelect value="titulo_provision_nacional" onChange={jest.fn()} />);

    const selectedBtn = screen.getByRole('radio', { name: /título en provisión nal\./i });
    expect(selectedBtn).toHaveAttribute('aria-checked', 'true');

    const otherBtn = screen.getByRole('radio', { name: /diploma académico/i });
    expect(otherBtn).toHaveAttribute('aria-checked', 'false');
  });
});
