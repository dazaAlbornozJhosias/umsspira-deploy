import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { BackupField } from './edit-record-layout';

function jpg(nombre: string, bytes = 1024) {
  return new File([new Uint8Array(bytes)], nombre, { type: 'image/jpeg' });
}

function renderBackup(onDocumentChange = jest.fn()) {
  const { container } = render(
    <BackupField documentName="" isVerified={false} onDocumentChange={onDocumentChange} />,
  );
  const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'));
  return { inputs, onDocumentChange };
}

describe('BackupField · validación del respaldo al editar', () => {
  it('rechaza un archivo que no es JPG y no lo adjunta', () => {
    const { inputs, onDocumentChange } = renderBackup();

    fireEvent.change(inputs[0], { target: { files: [new File(['x'], 'respaldo.pdf', { type: 'application/pdf' })] } });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  it('rechaza un JPG de más de 5 MB y no lo adjunta', () => {
    const { inputs, onDocumentChange } = renderBackup();

    fireEvent.change(inputs[0], { target: { files: [jpg('grande.jpg', 5 * 1024 * 1024 + 1)] } });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  it('acepta un JPG válido, avisa y quita el error anterior', () => {
    const { inputs, onDocumentChange } = renderBackup();

    fireEvent.change(inputs[0], { target: { files: [new File(['x'], 'malo.pdf', { type: 'application/pdf' })] } });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(inputs[0], { target: { files: [jpg('bueno.jpg')] } });

    expect(onDocumentChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

it('quitar la selección pendiente también retira su error de archivo inválido', () => {
  const remove = jest.fn();
  const { container } = render(<BackupField documentName="pendiente.jpg" isVerified={false} onDocumentChange={jest.fn()} onDocumentRemove={remove} />);
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(['x'], 'malo.pdf', { type: 'application/pdf' })] } });
  expect(screen.getByRole('alert')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Quitar imagen' }));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
