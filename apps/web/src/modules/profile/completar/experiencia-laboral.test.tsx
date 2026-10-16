import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ApiError } from '@/shared/services/api-client';

import { FormularioExperiencia } from './experiencia-laboral';

const MENSAJE = 'La fecha fin no puede ser anterior a la fecha inicio';

// Los inputs de fecha no tienen etiqueta propia: se toman en orden (inicio, fin)
function llenarFormulario(container: HTMLElement, fechaInicio: string, fechaFin: string) {
  const [inicio, fin] = Array.from(container.querySelectorAll('input[type="date"]'));
  fireEvent.change(screen.getByPlaceholderText('Ej. Jalasoft'), { target: { value: 'Jalasoft' } });
  fireEvent.change(screen.getByPlaceholderText('Ej. Desarrollador Frontend'), { target: { value: 'Dev' } });
  fireEvent.change(inicio, { target: { value: fechaInicio } });
  fireEvent.change(fin, { target: { value: fechaFin } });
  return { inicio, fin };
}

function agregar() {
  fireEvent.click(screen.getByRole('button', { name: 'Agregar experiencia' }));
}

describe('FormularioExperiencia · rango de fechas (BUG-HU2-003)', () => {
  it('muestra el error junto a la fecha fin y no agrega si es anterior a la fecha inicio (caso de QA)', () => {
    const onAgregar = jest.fn();
    const { container } = render(<FormularioExperiencia experiencias={[]} onAgregar={onAgregar} />);
    const { fin } = llenarFormulario(container, '2023-08-01', '2022-03-01');

    agregar();

    expect(screen.getByText(MENSAJE)).toHaveAttribute('id', 'error-fechaFin');
    expect(fin).toHaveAttribute('aria-invalid', 'true');
    expect(fin).toHaveValue('2022-03-01');
    expect(onAgregar).not.toHaveBeenCalled();
  });

  it('no acepta fechas anteriores a 1950 (BUG-HU2-008)', () => {
    const { container } = render(<FormularioExperiencia experiencias={[]} onAgregar={jest.fn()} />);

    for (const fecha of Array.from(container.querySelectorAll('input[type="date"]'))) {
      expect(fecha).toHaveAttribute('min', '1950-01-01');
    }
  });

  it('agrega si la fecha fin es igual o posterior a la fecha inicio', () => {
    const onAgregar = jest.fn();
    const { container } = render(<FormularioExperiencia experiencias={[]} onAgregar={onAgregar} />);
    llenarFormulario(container, '2023-08-01', '2023-08-01');

    agregar();

    expect(onAgregar).toHaveBeenCalledWith({
      empresa: 'Jalasoft',
      cargo: 'Dev',
      fechaInicio: '2023-08-01',
      fechaFin: '2023-08-01',
    });
    expect(screen.queryByText(MENSAJE)).not.toBeInTheDocument();
  });

  it('quita el error al corregir la fecha fin', () => {
    const { container } = render(<FormularioExperiencia experiencias={[]} onAgregar={jest.fn()} />);
    const { fin } = llenarFormulario(container, '2023-08-01', '2022-03-01');
    agregar();

    fireEvent.change(fin, { target: { value: '2024-01-31' } });

    expect(screen.queryByText(MENSAJE)).not.toBeInTheDocument();
    expect(fin).toHaveAttribute('aria-invalid', 'false');
  });

  it('no valida el rango al marcar "Actualmente trabajo aquí"', () => {
    const onAgregar = jest.fn();
    const { container } = render(<FormularioExperiencia experiencias={[]} onAgregar={onAgregar} />);
    llenarFormulario(container, '2023-08-01', '2022-03-01');
    agregar();

    fireEvent.click(screen.getByLabelText('Actualmente trabajo aquí'));
    expect(screen.queryByText(MENSAJE)).not.toBeInTheDocument();

    agregar();
    expect(onAgregar).toHaveBeenCalledWith({ empresa: 'Jalasoft', cargo: 'Dev', fechaInicio: '2023-08-01', fechaFin: undefined });
  });
});

describe('FormularioExperiencia · error al guardar en la API', () => {
  it('muestra el mensaje del backend, no limpia y lo quita al cambiar un campo', async () => {
    const mensaje = 'La fecha de inicio no puede ser posterior a hoy';
    const onAgregar = jest.fn().mockRejectedValue(new ApiError(400, mensaje));
    const { container } = render(<FormularioExperiencia experiencias={[]} onAgregar={onAgregar} />);
    llenarFormulario(container, '2023-08-01', '2024-01-31');

    agregar();

    expect(await screen.findByText(mensaje)).toHaveAttribute('id', 'error-experiencia-guardar');
    expect(screen.getByPlaceholderText('Ej. Jalasoft')).toHaveValue('Jalasoft');

    fireEvent.change(screen.getByPlaceholderText('Ej. Desarrollador Frontend'), { target: { value: 'Tech Lead' } });
    expect(screen.queryByText(mensaje)).not.toBeInTheDocument();
  });

  it('no llama a la API si la fecha fin es anterior a la fecha inicio', () => {
    const onAgregar = jest.fn();
    const { container } = render(<FormularioExperiencia experiencias={[]} onAgregar={onAgregar} />);
    llenarFormulario(container, '2023-08-01', '2022-03-01');

    agregar();

    expect(onAgregar).not.toHaveBeenCalled();
  });
});
