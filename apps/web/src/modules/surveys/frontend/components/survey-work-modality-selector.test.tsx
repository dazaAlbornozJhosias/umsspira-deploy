import { fireEvent, render, screen } from '@testing-library/react';

import { SurveyWorkModalitySelector } from './survey-work-modality-selector';

const seleccionadas = () =>
  screen.getAllByRole('radio').filter((radio) => radio.getAttribute('aria-checked') === 'true');

describe('SurveyWorkModalitySelector', () => {
  it('muestra las tres modalidades en orden', () => {
    render(<SurveyWorkModalitySelector value={null} onChange={jest.fn()} onBlur={jest.fn()} />);
    const opciones = screen.getAllByRole('radio').map((radio) => radio.textContent);
    expect(opciones).toEqual(['Presencial', 'Remoto', 'Híbrido']);
  });

  it('muestra la pregunta como obligatoria', () => {
    render(<SurveyWorkModalitySelector value={null} onChange={jest.fn()} onBlur={jest.fn()} />);
    expect(screen.getByText(/Modalidad de trabajo/)).toBeTruthy();
    expect(screen.getByText('*')).toBeTruthy();
  });

  it('inicia sin ninguna opción seleccionada', () => {
    render(<SurveyWorkModalitySelector value={null} onChange={jest.fn()} onBlur={jest.fn()} />);
    expect(seleccionadas()).toHaveLength(0);
  });

  it('permite una sola opción seleccionada', () => {
    render(<SurveyWorkModalitySelector value="Remoto" onChange={jest.fn()} onBlur={jest.fn()} />);
    expect(seleccionadas()).toHaveLength(1);
    expect(seleccionadas()[0].textContent).toBe('Remoto');
  });

  it('avisa la modalidad elegida y marca el campo como tocado', () => {
    const onChange = jest.fn();
    const onBlur = jest.fn();
    render(<SurveyWorkModalitySelector value={null} onChange={onChange} onBlur={onBlur} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Híbrido' }));
    expect(onChange).toHaveBeenCalledWith('Hibrido');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('muestra el mensaje de error solo si el campo fue tocado', () => {
    render(
      <SurveyWorkModalitySelector
        value={null}
        touched
        error="Este campo es obligatorio"
        onChange={jest.fn()}
        onBlur={jest.fn()}
      />,
    );
    expect(screen.getByRole('alert').textContent).toBe('Este campo es obligatorio');
  });

  it('no muestra el error si el campo no fue tocado', () => {
    render(
      <SurveyWorkModalitySelector
        value={null}
        error="Este campo es obligatorio"
        onChange={jest.fn()}
        onBlur={jest.fn()}
      />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('deshabilitado no permite elegir', () => {
    const onChange = jest.fn();
    render(<SurveyWorkModalitySelector value={null} disabled onChange={onChange} onBlur={jest.fn()} />);
    screen.getAllByRole('radio').forEach((radio) => expect((radio as HTMLButtonElement).disabled).toBe(true));
    fireEvent.click(screen.getByRole('radio', { name: 'Remoto' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});