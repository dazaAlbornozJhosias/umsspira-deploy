import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OtpInput } from './otp-input';

describe('OtpInput Component', () => {
  it('debe renderizar 6 casillas de entrada numérica', () => {
    const onChangeMock = jest.fn();
    render(<OtpInput value={['', '', '', '', '', '']} onChange={onChangeMock} />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('debe llamar a onChange al ingresar un número en una casilla', () => {
    const onChangeMock = jest.fn();
    render(<OtpInput value={['', '', '', '', '', '']} onChange={onChangeMock} />);

    const firstInput = screen.getByLabelText('Dígito 1 de 6');
    fireEvent.change(firstInput, { target: { value: '5' } });

    expect(onChangeMock).toHaveBeenCalledWith(['5', '', '', '', '', '']);
  });

  it('debe filtrar caracteres no numéricos', () => {
    const onChangeMock = jest.fn();
    render(<OtpInput value={['', '', '', '', '', '']} onChange={onChangeMock} />);

    const firstInput = screen.getByLabelText('Dígito 1 de 6');
    fireEvent.change(firstInput, { target: { value: 'a' } });

    expect(onChangeMock).toHaveBeenCalledWith(['', '', '', '', '', '']);
  });

  it('debe manejar pegado de texto con 6 números', () => {
    const onChangeMock = jest.fn();
    render(<OtpInput value={['', '', '', '', '', '']} onChange={onChangeMock} />);

    const firstInput = screen.getByLabelText('Dígito 1 de 6');
    fireEvent.paste(firstInput, {
      clipboardData: {
        getData: () => '123456',
      },
    });

    expect(onChangeMock).toHaveBeenCalledWith(['1', '2', '3', '4', '5', '6']);
  });
});
