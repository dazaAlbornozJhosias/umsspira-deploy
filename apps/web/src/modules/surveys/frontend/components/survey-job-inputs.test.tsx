import { fireEvent, render, screen } from '@testing-library/react';

import type { SurveyJobFormValues, SurveyJobInputsProps } from '../types/survey-job.types';
import { SurveyJobInputs } from './survey-job-inputs';

const vacio: SurveyJobFormValues = { cargo: '', empresa: '', area: '', modalidad: null };

function renderizar(props: Partial<SurveyJobInputsProps> = {}) {
  const onChange = jest.fn();
  const onBlur = jest.fn();
  render(
    <SurveyJobInputs values={vacio} errors={{}} touched={{}} onChange={onChange} onBlur={onBlur} {...props} />,
  );
  return { onChange, onBlur };
}

const cargo = () => screen.getByPlaceholderText('Ej. Analista de sistemas') as HTMLInputElement;
const empresa = () => screen.getByPlaceholderText('Ej. Nombre de la empresa') as HTMLInputElement;
const area = () => screen.getByPlaceholderText('Ej. Desarrollo de software') as HTMLInputElement;

describe('SurveyJobInputs', () => {
  it('muestra cargo, empresa, área y modalidad como obligatorios', () => {
    renderizar();
    expect(screen.getByText(/^Cargo/)).toBeTruthy();
    expect(screen.getByText(/^Empresa/)).toBeTruthy();
    expect(screen.getByText(/^Área o departamento/)).toBeTruthy();
    expect(screen.getByText(/Modalidad de trabajo/)).toBeTruthy();
    expect(screen.getAllByText('*')).toHaveLength(4);
  });

  it('limita cargo, empresa y área a 100 caracteres (CA de la HU-2)', () => {
    renderizar();
    expect(cargo().maxLength).toBe(100);
    expect(empresa().maxLength).toBe(100);
    expect(area().maxLength).toBe(100);
  });

  it('muestra los valores recibidos', () => {
    renderizar({ values: { cargo: 'Analista', empresa: 'Acme', area: 'Sistemas', modalidad: 'Remoto' } });
    expect(cargo().value).toBe('Analista');
    expect(empresa().value).toBe('Acme');
    expect(area().value).toBe('Sistemas');
  });

  it.each([
    ['cargo', cargo],
    ['empresa', empresa],
    ['area', area],
  ] as const)('avisa el campo y el valor escritos en %s', (campo, obtener) => {
    const { onChange } = renderizar();
    fireEvent.change(obtener(), { target: { value: 'Texto de prueba' } });
    expect(onChange).toHaveBeenCalledWith(campo, 'Texto de prueba');
  });

  it.each([
    ['cargo', cargo],
    ['empresa', empresa],
    ['area', area],
  ] as const)('marca %s como tocado al salir del campo', (campo, obtener) => {
    const { onBlur } = renderizar();
    fireEvent.blur(obtener());
    expect(onBlur).toHaveBeenCalledWith(campo);
  });

  it('muestra el error de un campo solo si fue tocado', () => {
    renderizar({ errors: { cargo: 'Este campo es obligatorio' }, touched: { cargo: true } });
    expect(screen.getByRole('alert').textContent).toBe('Este campo es obligatorio');
  });

  it('no muestra el error de un campo que no fue tocado', () => {
    renderizar({ errors: { cargo: 'Este campo es obligatorio' }, touched: {} });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('con varios errores muestra solo los de campos tocados', () => {
    renderizar({
      errors: { cargo: 'Este campo es obligatorio', empresa: 'Este campo es obligatorio' },
      touched: { empresa: true },
    });
    const alertas = screen.getAllByRole('alert');
    expect(alertas).toHaveLength(1);
    expect(alertas[0].textContent).toBe('Este campo es obligatorio');
  });

  it('permite elegir la modalidad desde el formulario', () => {
    const { onChange } = renderizar();
    fireEvent.click(screen.getByRole('radio', { name: 'Remoto' }));
    expect(onChange).toHaveBeenCalledWith('modalidad', 'Remoto');
  });

  it('deshabilitado bloquea todos los campos', () => {
    renderizar({ disabled: true });
    expect(cargo().disabled).toBe(true);
    expect(empresa().disabled).toBe(true);
    expect(area().disabled).toBe(true);
    screen.getAllByRole('radio').forEach((radio) => expect((radio as HTMLButtonElement).disabled).toBe(true));
  });
});