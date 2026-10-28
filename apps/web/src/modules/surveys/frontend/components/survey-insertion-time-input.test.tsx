import { fireEvent, render, screen } from '@testing-library/react';

import { SurveyInsertionTimeInput, nextInsertionTime } from './survey-insertion-time-input';

describe('nextInsertionTime', () => {
  it.each([
    ['', '6', '6'],
    ['1', '12', '12'],
    ['', '0', '0'],
    ['12', '', ''],
    ['', 'seis', ''],
    ['', '12 meses', ''],
    ['', '-3', ''],
    ['', '2.5', ''],
    ['2', '2.', '2'],
    ['150', '1500', '150'],
  ])('con «%s» y lo escrito «%s», queda «%s»', (actual, escrito, queda) => {
    expect(nextInsertionTime(actual, escrito)).toBe(queda);
  });
});

describe('SurveyInsertionTimeInput', () => {
  it('muestra la etiqueta y el ejemplo del mock-up', () => {
    render(<SurveyInsertionTimeInput value="" onChange={jest.fn()} />);
    const campo = screen.getByLabelText(/Tiempo de inserción laboral \(meses\)/) as HTMLInputElement;
    expect(campo.placeholder).toBe('Ej. 6');
    expect(campo.inputMode).toBe('numeric');
  });

  it('acepta un número de meses', () => {
    const onChange = jest.fn();
    render(<SurveyInsertionTimeInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Tiempo de inserción/), { target: { value: '18' } });
    expect(onChange).toHaveBeenCalledWith('18');
  });

  it('acepta 0 meses (ya trabajaba al titularse)', () => {
    const onChange = jest.fn();
    render(<SurveyInsertionTimeInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Tiempo de inserción/), { target: { value: '0' } });
    expect(onChange).toHaveBeenCalledWith('0');
  });

  it.each(['seis', '2.5', '-3', '12 meses'])('impide ingresar «%s» y conserva el valor anterior', (invalido) => {
    const onChange = jest.fn();
    render(<SurveyInsertionTimeInput value="6" onChange={onChange} />);
    const campo = screen.getByLabelText(/Tiempo de inserción/) as HTMLInputElement;
    fireEvent.change(campo, { target: { value: invalido } });
    expect(onChange).not.toHaveBeenCalled();
    expect(campo.value).toBe('6');
  });

  it('no deja pasar de 3 dígitos', () => {
    const onChange = jest.fn();
    render(<SurveyInsertionTimeInput value="150" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Tiempo de inserción/), { target: { value: '1500' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('permite borrar el valor', () => {
    const onChange = jest.fn();
    render(<SurveyInsertionTimeInput value="6" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Tiempo de inserción/), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('marca el campo y muestra el mensaje de error', () => {
    render(<SurveyInsertionTimeInput value="" onChange={jest.fn()} error="Este campo es obligatorio" />);
    expect(screen.getByRole('alert').textContent).toBe('Este campo es obligatorio');
    expect(screen.getByLabelText(/Tiempo de inserción/).getAttribute('aria-invalid')).toBe('true');
  });
});
