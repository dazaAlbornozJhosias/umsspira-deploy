import { render, screen } from '@testing-library/react';
import { EventsHeader } from './events-ui';

describe('EventsHeader', () => {
  it('mantiene los estilos de eventos sin montar un navbar duplicado', () => {
    render(
      <EventsHeader>
        <p>Contenido de eventos</p>
      </EventsHeader>,
    );

    expect(screen.getByText('Contenido de eventos').parentElement)
      .toHaveClass('events-app');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});
