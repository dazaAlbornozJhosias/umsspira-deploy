import { render, screen, waitFor } from '@testing-library/react';
import { ReportsAccessDeniedNotice } from './reports-access-denied-notice';

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

it('informa al titulado por qué no puede entrar a reportes', async () => {
  window.history.pushState({}, '', '/portal?acceso=reportes-no-autorizado');
  render(<ReportsAccessDeniedNotice />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Acceso no autorizado: requiere rol de Administrador de Carrera',
  );
});

it('no muestra mensajes fuera del flujo de acceso denegado', async () => {
  window.history.pushState({}, '', '/portal');
  render(<ReportsAccessDeniedNotice />);
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
