import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ApiError } from '@/shared/services/api-client';

import { FormularioDescripcion, MAX_DESCRIPCION } from './descripcion-profesional';

describe('FormularioDescripcion (T6.2)', () => {
  it('precarga la descripción guardada y muestra el contador', () => {
    render(<FormularioDescripcion descripcion="Desarrolladora backend" onGuardar={jest.fn()} />);

    expect(screen.getByLabelText('Descripción profesional')).toHaveValue('Desarrolladora backend');
    expect(screen.getByText('22/5000 caracteres')).toBeInTheDocument();
  });

  it('muestra la descripción que llega de la API después de montarse', () => {
    const { rerender } = render(<FormularioDescripcion descripcion="" onGuardar={jest.fn()} />);

    rerender(<FormularioDescripcion descripcion="Llegó del backend" onGuardar={jest.fn()} />);

    expect(screen.getByLabelText('Descripción profesional')).toHaveValue('Llegó del backend');
  });

  it('no pisa lo que el egresado ya escribió', () => {
    const { rerender } = render(<FormularioDescripcion descripcion="" onGuardar={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Descripción profesional'), { target: { value: 'Mi texto' } });

    rerender(<FormularioDescripcion descripcion="Llegó del backend" onGuardar={jest.fn()} />);

    expect(screen.getByLabelText('Descripción profesional')).toHaveValue('Mi texto');
  });

  it('actualiza el contador al escribir y no deja pasar de 5000 caracteres', () => {
    render(<FormularioDescripcion descripcion="" onGuardar={jest.fn()} />);
    const cuadro = screen.getByLabelText('Descripción profesional');

    fireEvent.change(cuadro, { target: { value: 'Hola' } });
    expect(screen.getByText('4/5000 caracteres')).toBeInTheDocument();
    expect(cuadro).toHaveAttribute('maxLength', String(MAX_DESCRIPCION));
  });

  // 👇 Corregido: async y waitFor
  it('Guardar envía el texto sin espacios al inicio ni al final', async () => {
    const onGuardar = jest.fn().mockResolvedValue(undefined);
    render(<FormularioDescripcion descripcion="" onGuardar={onGuardar} />);

    fireEvent.change(screen.getByLabelText('Descripción profesional'), {
      target: { value: '  Analista de datos  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(onGuardar).toHaveBeenCalledWith('Analista de datos');
    });
  });
});

describe('Guardado de la descripción (T6.3)', () => {
  function escribirYGuardar(texto: string) {
    fireEvent.change(screen.getByLabelText('Descripción profesional'), { target: { value: texto } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  }

  it('muestra «Descripción guardada» cuando la API guarda', async () => {
    render(<FormularioDescripcion descripcion="" onGuardar={jest.fn().mockResolvedValue(undefined)} />);

    escribirYGuardar('Analista de datos');

    expect(await screen.findByRole('status')).toHaveTextContent('Descripción guardada');
  });

  it('si falla muestra el error y conserva el texto escrito', async () => {
    const onGuardar = jest.fn().mockRejectedValue(new ApiError(0, 'No fue posible conectar con el servidor'));
    render(<FormularioDescripcion descripcion="" onGuardar={onGuardar} />);

    escribirYGuardar('Texto que no debe perderse');

    expect(await screen.findByText('No fue posible conectar con el servidor')).toBeInTheDocument();
    expect(screen.queryByText('Descripción guardada')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Descripción profesional')).toHaveValue('Texto que no debe perderse');
  });

  it('al volver a escribir se quita el aviso anterior', async () => {
    render(<FormularioDescripcion descripcion="" onGuardar={jest.fn().mockResolvedValue(undefined)} />);
    escribirYGuardar('Primera versión');
    await screen.findByRole('status');

    fireEvent.change(screen.getByLabelText('Descripción profesional'), { target: { value: 'Otra' } });

    expect(screen.queryByText('Descripción guardada')).not.toBeInTheDocument();
  });
});