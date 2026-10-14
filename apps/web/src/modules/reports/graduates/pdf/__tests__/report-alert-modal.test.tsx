import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReportAlertModal } from '../components/report-alert-modal';

describe('ReportAlertModal', () => {
  it('muestra el mensaje y Entendido cierra la alerta', () => {
    const onClose = jest.fn();
    render(<ReportAlertModal message="No hay titulados observados para exportar" onClose={onClose} />);

    expect(screen.getByRole('alertdialog')).toHaveTextContent('No hay titulados observados para exportar');
    fireEvent.click(screen.getByRole('button', { name: /entendido/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('el foco queda en Entendido y Esc también cierra', () => {
    const onClose = jest.fn();
    render(<ReportAlertModal message="No se pudo generar el reporte PDF. Intente nuevamente." onClose={onClose} />);

    expect(screen.getByRole('button', { name: /entendido/i })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tiene nombre accesible y Tab no saca el foco de la alerta', () => {
    render(
      <>
        <button type="button">Detrás</button>
        <ReportAlertModal message="No hay titulados verificados para exportar" onClose={jest.fn()} />
      </>,
    );
    const understood = screen.getByRole('button', { name: /entendido/i });

    expect(screen.getByRole('alertdialog', { name: 'Aviso de exportación' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(understood).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(understood).toHaveFocus();
  });
});
