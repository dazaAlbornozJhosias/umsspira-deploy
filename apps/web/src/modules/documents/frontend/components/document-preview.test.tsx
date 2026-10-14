import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { DocumentPreview } from './document-preview';

function buildFile(name: string, type: string, size = 1024) {
  const file = new File(['contenido'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('DocumentPreview', () => {
  it('muestra la imagen adjunta con su nombre y tamaño (CA-03.4)', () => {
    const file = buildFile('diploma.png', 'image/png', 1536 * 1024);
    render(<DocumentPreview file={file} previewUrl="blob:imagen" previewKind="image" onReplace={jest.fn()} />);

    expect(screen.getByRole('img', { name: 'Vista previa de diploma.png' })).toHaveAttribute('src', 'blob:imagen');
    expect(screen.getByText('diploma.png')).toBeInTheDocument();
    expect(screen.getByText('Documento cargado correctamente')).toBeInTheDocument();
    expect(screen.getByText('1,5 MB · Imagen')).toBeInTheDocument();
  });

  it('muestra el PDF adjunto dentro de la página', () => {
    const file = buildFile('titulo.pdf', 'application/pdf', 200 * 1024);
    const { container } = render(
      <DocumentPreview file={file} previewUrl="blob:pdf" previewKind="pdf" onReplace={jest.fn()} />,
    );

    const viewer = container.querySelector('object');
    expect(viewer).toHaveAttribute('data', 'blob:pdf');
    expect(viewer).toHaveAttribute('type', 'application/pdf');
    expect(screen.getByText('200 KB · Documento PDF')).toBeInTheDocument();
  });

  it('permite reemplazar el archivo con el botón "Reemplazar archivo"', () => {
    const onReplace = jest.fn();
    const file = buildFile('titulo.pdf', 'application/pdf');
    render(<DocumentPreview file={file} previewUrl="blob:pdf" previewKind="pdf" onReplace={onReplace} />);

    expect(screen.getByRole('button', { name: 'Reemplazar archivo' })).toBeEnabled();
    const nextFile = buildFile('nuevo.png', 'image/png');
    fireEvent.change(screen.getByTestId('replace-document-input'), { target: { files: [nextFile] } });

    expect(onReplace).toHaveBeenCalledWith(nextFile);
  });
});
