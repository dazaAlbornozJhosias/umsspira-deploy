import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VerifyEmailForm } from './verify-email-form';
import { useEmailVerificationStore } from '../store/email-verification.store';

describe('VerifyEmailForm Component', () => {
  beforeEach(() => {
    useEmailVerificationStore.getState().reset();
  });

  it('debe renderizar el título de verificación y correo enmascarado', () => {
    render(<VerifyEmailForm initialEmail="usuario.prueba@umss.edu" />);

    expect(screen.getByText('Verifica tu correo electrónico')).toBeInTheDocument();
    expect(screen.getByText('us****a@umss.edu')).toBeInTheDocument();
  });

  it('debe mantener deshabilitado el botón hasta completar los 6 dígitos', () => {
    render(<VerifyEmailForm />);

    const submitBtn = screen.getByRole('button', { name: /verificar código y continuar/i });
    expect(submitBtn).toBeDisabled();

    // Llenamos solo 3 casillas
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(inputs[2], { target: { value: '3' } });

    expect(submitBtn).toBeDisabled();

    // Completamos las 3 restantes
    fireEvent.change(inputs[3], { target: { value: '4' } });
    fireEvent.change(inputs[4], { target: { value: '5' } });
    fireEvent.change(inputs[5], { target: { value: '6' } });

    expect(submitBtn).not.toBeDisabled();
  });

  it('debe llamar a onEditData al presionar Corregir mis datos', () => {
    const onEditDataMock = jest.fn();
    render(<VerifyEmailForm onEditData={onEditDataMock} />);

    const editBtn = screen.getByRole('button', { name: /corregir mis datos/i });
    fireEvent.click(editBtn);

    expect(onEditDataMock).toHaveBeenCalledTimes(1);
  });
});
