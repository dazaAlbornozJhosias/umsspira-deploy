import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { SeccionAcordeon } from './seccion-acordeon';

describe('SeccionAcordeon · contador de errores (HU-02, AC 6)', () => {
  it('muestra el número de errores en el encabezado, en singular y en plural', () => {
    const { rerender } = render(
      <SeccionAcordeon numero={1} titulo="Formación académica" descripcion="d" cantidad={0} errores={1} />,
    );
    expect(screen.getByText('1 error')).toBeInTheDocument();

    rerender(<SeccionAcordeon numero={1} titulo="Formación académica" descripcion="d" cantidad={0} errores={3} />);
    expect(screen.getByText('3 errores')).toBeInTheDocument();
  });

  it('no muestra contador sin errores', () => {
    render(<SeccionAcordeon numero={1} titulo="Formación académica" descripcion="d" cantidad={0} />);

    expect(screen.queryByText(/error/)).not.toBeInTheDocument();
  });

  it('con la sección cerrada deja el formulario montado pero oculto, para conservar sus errores', () => {
    render(
      <SeccionAcordeon numero={1} titulo="Formación académica" descripcion="d" cantidad={0}>
        <p>contenido del formulario</p>
      </SeccionAcordeon>,
    );

    expect(screen.getByText('contenido del formulario')).not.toBeVisible();
  });
});
