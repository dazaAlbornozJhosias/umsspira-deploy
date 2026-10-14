import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExportMenu } from '../components/export-menu';

describe('ExportMenu', () => {
  it('abre el menú y exporta en PDF el estado de la pestaña activa', () => {
    const onExportPdf = jest.fn();
    render(<ExportMenu status="observed" isGenerating={false} onExportPdf={onExportPdf} />);

    fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /pdf/i }));

    expect(onExportPdf).toHaveBeenCalledWith('observed');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('sin estado ofrece PDF de verificados y de observados', () => {
    const onExportPdf = jest.fn();
    render(<ExportMenu isGenerating={false} onExportPdf={onExportPdf} />);

    fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
    const options = screen.getAllByRole('menuitem');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('PDF de verificados');
    expect(options[1]).toHaveTextContent('PDF de observados');

    fireEvent.click(screen.getByRole('menuitem', { name: /pdf de observados/i }));
    expect(onExportPdf).toHaveBeenCalledWith('observed');
  });

  it('con estado ofrece una sola opción PDF', () => {
    render(<ExportMenu status="verified" isGenerating={false} onExportPdf={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /exportar/i }));

    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(screen.queryByText(/pdf de/i)).not.toBeInTheDocument();
  });

  it('mientras genera muestra «Generando…» y queda deshabilitado', () => {
    render(<ExportMenu status="verified" isGenerating onExportPdf={jest.fn()} />);

    const button = screen.getByRole('button', { name: /generando/i });
    expect(button).toBeDisabled();
  });

  it('no ofrece la opción CSV (es de la HU5)', () => {
    render(<ExportMenu status="verified" isGenerating={false} onExportPdf={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /exportar/i }));

    expect(screen.queryByText(/csv/i)).not.toBeInTheDocument();
  });

  it('al abrir enfoca la primera opción y las flechas recorren el menú', () => {
    render(<ExportMenu isGenerating={false} onExportPdf={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
    const [verified, observed] = screen.getAllByRole('menuitem');
    expect(verified).toHaveFocus();

    fireEvent.keyDown(verified, { key: 'ArrowDown' });
    expect(observed).toHaveFocus();
    fireEvent.keyDown(observed, { key: 'ArrowDown' });
    expect(verified).toHaveFocus();
    fireEvent.keyDown(verified, { key: 'End' });
    expect(observed).toHaveFocus();
    fireEvent.keyDown(observed, { key: 'ArrowUp' });
    expect(verified).toHaveFocus();
  });

  it('Esc cierra el menú y devuelve el foco al botón', () => {
    render(<ExportMenu status="verified" isGenerating={false} onExportPdf={jest.fn()} />);
    const button = screen.getByRole('button', { name: /exportar/i });

    fireEvent.click(button);
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('Cancelar cierra el menú sin exportar', () => {
    const onExportPdf = jest.fn();
    render(<ExportMenu status="verified" isGenerating={false} onExportPdf={onExportPdf} />);

    fireEvent.click(screen.getByRole('button', { name: /exportar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onExportPdf).not.toHaveBeenCalled();
  });
});
