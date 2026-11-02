import { render, screen } from '@testing-library/react';
import { ReviewSummaryNotice } from './review-summary-notice';

const summary = { observations: 2, maxObservations: 2, rejections: 4, maxRejections: 5,
  latestObservation: 'El sello no es legible', canObserve: false };

describe('T-11.3 avisos de revisión', () => {
  it('muestra los datos reales, la nota y los límites alcanzados', () => {
    render(<ReviewSummaryNotice summary={summary} pending currentReviewer={{ name: 'Yadira', email: 'admin@example.com' }} />);
    expect(screen.getByText('Observaciones: 2 de 2')).toBeInTheDocument();
    expect(screen.getByText('Rechazos acumulados: 4 de 5')).toBeInTheDocument();
    expect(screen.getByText(/El sello no es legible/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/no se permite otra observación/);
    expect(screen.getByText(/Un nuevo rechazo alcanzará/)).toBeInTheDocument();
    expect(screen.getByText(/admin@example.com/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('no inventa ceros cuando falta el contrato del servidor', () => {
    render(<ReviewSummaryNotice pending />);
    expect(screen.getByRole('alert')).toHaveTextContent(/No se pudieron consultar/);
    expect(screen.queryByText(/Observaciones: 0/)).not.toBeInTheDocument();
  });
  it('permite continuar observando antes del límite sin aviso de rechazo', () => {
    render(<ReviewSummaryNotice pending summary={{ ...summary, observations: 1, rejections: 3, canObserve: true }} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/Un nuevo rechazo alcanzará/)).not.toBeInTheDocument();
  });
});
