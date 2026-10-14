import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentDropzone, ERROR_FILE_INVALID } from './document-dropzone';

describe('DocumentDropzone Component', () => {
  it('debe renderizar la zona de arrastre cuando no hay archivo seleccionado', () => {
    render(<DocumentDropzone file={null} onFileSelect={jest.fn()} />);

    expect(screen.getByText('Seleccionar archivo local o cámara')).toBeInTheDocument();
    expect(screen.getByText('O arrastra el documento aquí')).toBeInTheDocument();
    expect(screen.getByText(/PDF, JPG o PNG \(≤ 5 MB\)/i)).toBeInTheDocument();
  });

  it('debe aceptar un archivo PDF válido menor a 5 MB', () => {
    const onFileSelectMock = jest.fn();
    render(<DocumentDropzone file={null} onFileSelect={onFileSelectMock} />);

    const input = screen.getByLabelText('Subir documento de respaldo');
    const validFile = new File(['dummy content'], 'diploma.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [validFile] } });

    expect(onFileSelectMock).toHaveBeenCalledWith(validFile);
  });

  it('debe rechazar un archivo que supere 5 MB y mostrar el mensaje oficial (CA-03.3)', () => {
    const onFileSelectMock = jest.fn();
    render(<DocumentDropzone file={null} onFileSelect={onFileSelectMock} />);

    const input = screen.getByLabelText('Subir documento de respaldo');
    // Creamos un archivo simulado de 6 MB (6 * 1024 * 1024 bytes)
    const largeFile = new File([new Uint8Array(6 * 1024 * 1024)], 'archivo_pesado.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(onFileSelectMock).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(ERROR_FILE_INVALID);
  });

  it('debe rechazar un formato no permitido (ej. .txt o .exe) (CA-03.3)', () => {
    const onFileSelectMock = jest.fn();
    render(<DocumentDropzone file={null} onFileSelect={onFileSelectMock} />);

    const input = screen.getByLabelText('Subir documento de respaldo');
    const invalidFile = new File(['text'], 'nota.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(onFileSelectMock).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(ERROR_FILE_INVALID);
  });

  it('debe mostrar la tarjeta de vista previa con badge Válido y permitir quitar el archivo', () => {
    const onFileSelectMock = jest.fn();
    const testFile = new File(['test'], 'mi_titulo.pdf', { type: 'application/pdf' });

    render(<DocumentDropzone file={testFile} onFileSelect={onFileSelectMock} />);

    expect(screen.getByText('mi_titulo.pdf')).toBeInTheDocument();
    expect(screen.getByText('Válido')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /quitar archivo/i });
    fireEvent.click(removeBtn);

    expect(onFileSelectMock).toHaveBeenCalledWith(null);
  });
});
