import { fireEvent, render, screen } from '@testing-library/react';

import { SALARY_RANGES, SurveySalarySelector } from './survey-salary-selectors';

describe('SurveySalarySelector', () => {
  it('muestra los cinco rangos de salario en orden', () => {
    render(<SurveySalarySelector value="" onChange={jest.fn()} />);
    const opciones = screen.getAllByRole('radio').map((radio) => (radio as HTMLInputElement).value);
    expect(opciones).toEqual([...SALARY_RANGES]);
    expect(opciones).toEqual(['0–2.999', '3.000–5.000', '5.001–8.000', '8.001–12.000', '12.001–21.000']);
  });

  it('muestra la pregunta como obligatoria', () => {
    render(<SurveySalarySelector value="" onChange={jest.fn()} />);
    expect(screen.getByText(/Salario mensual · rango en Bs/)).toBeTruthy();
  });

  it('avisa el rango elegido', () => {
    const onChange = jest.fn();
    render(<SurveySalarySelector value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: '5.001–8.000' }));
    expect(onChange).toHaveBeenCalledWith('5.001–8.000');
  });

  it('permite una sola opción seleccionada', () => {
    render(<SurveySalarySelector value="8.001–12.000" onChange={jest.fn()} />);
    const seleccionadas = screen.getAllByRole('radio').filter((radio) => (radio as HTMLInputElement).checked);
    expect(seleccionadas).toHaveLength(1);
    expect((seleccionadas[0] as HTMLInputElement).value).toBe('8.001–12.000');
  });

  it('muestra el mensaje de error cuando se le pasa', () => {
    render(<SurveySalarySelector value="" onChange={jest.fn()} error="Este campo es obligatorio" />);
    expect(screen.getByRole('alert').textContent).toBe('Este campo es obligatorio');
  });

  it('no muestra mensaje de error si no hay error', () => {
    render(<SurveySalarySelector value="" onChange={jest.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
