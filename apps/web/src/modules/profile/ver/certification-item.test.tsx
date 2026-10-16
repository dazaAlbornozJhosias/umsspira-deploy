import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import type { TimelineItem } from '@/modules/profile/data/profile-data';

import CertificationItem from './certification-item';

const withBackup: TimelineItem = {
  title: 'AWS Solutions Architect',
  subtitle: 'Amazon Web Services · 2022',
  issuer: 'Amazon Web Services',
  year: '2022',
  grade: 'Profesional',
  detail: 'Grado: Profesional',
  document: 'respaldo.pdf',
  documentUrl: '/respaldos/aws.pdf',
  status: 'verified',
};

const withoutBackup: TimelineItem = {
  title: 'Google Cloud Engineer',
  subtitle: 'Google · 2023',
  issuer: 'Google',
  year: '2023',
  grade: 'Profesional',
  status: 'missing',
};

function Harness({ item }: { item: TimelineItem }) {
  const [open, setOpen] = useState(false);
  return (
    <CertificationItem
      item={item}
      isOpen={open}
      onToggle={() => setOpen((value) => !value)}
      status={<span>Respaldo verificado</span>}
    />
  );
}

describe('CertificationItem', () => {
  it('cerrada se ve como en la v3 y no muestra los datos extendidos', () => {
    render(<Harness item={withBackup} />);

    expect(screen.getByRole('button', { name: /AWS Solutions Architect/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('Amazon Web Services · 2022')).toBeInTheDocument();
    expect(screen.getByText('Grado: Profesional')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'respaldo.pdf' })).toBeInTheDocument();
    expect(screen.getByText('Respaldo verificado')).toBeInTheDocument();
    expect(screen.queryByText('Entidad emisora')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Descargar respaldo.pdf' })).not.toBeInTheDocument();
  });

  it('al hacer clic muestra entidad, año y grado', () => {
    render(<Harness item={withBackup} />);

    fireEvent.click(screen.getByRole('button', { name: /AWS Solutions Architect/ }));

    expect(screen.getByText('Entidad emisora').nextSibling).toHaveTextContent('Amazon Web Services');
    expect(screen.getByText('Año').nextSibling).toHaveTextContent('2022');
    expect(screen.getByText('Grado').nextSibling).toHaveTextContent('Profesional');
  });

  it('con respaldo muestra el nombre del archivo', () => {
    render(<Harness item={withBackup} />);

    fireEvent.click(screen.getByRole('button', { name: /AWS Solutions Architect/ }));

    const detail = screen.getByText('Entidad emisora').closest('div[id]') as HTMLElement;
    expect(within(detail).getByText('respaldo.pdf')).toBeInTheDocument();
    expect(within(detail).getByRole('link', { name: 'Descargar respaldo.pdf' })).toBeInTheDocument();
  });

  it('cada respaldo abre su propio archivo (E2.2)', () => {
    render(<Harness item={withBackup} />);

    expect(screen.getByRole('link', { name: 'respaldo.pdf' })).toHaveAttribute('href', '/respaldos/aws.pdf');
  });

  it('sin dirección del archivo muestra el nombre sin enlace', () => {
    render(<Harness item={{ ...withBackup, documentUrl: undefined }} />);

    expect(screen.getByText('respaldo.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'respaldo.pdf' })).not.toBeInTheDocument();
  });

  it('sin respaldo muestra el aviso', () => {
    render(<Harness item={withoutBackup} />);

    fireEvent.click(screen.getByRole('button', { name: /Google Cloud Engineer/ }));

    expect(
      screen.getByText('Esta certificación no tiene un documento adjunto.'),
    ).toBeInTheDocument();
  });

  it('con Enter abre y cierra', () => {
    render(<Harness item={withBackup} />);
    const header = screen.getByRole('button', { name: /AWS Solutions Architect/ });

    fireEvent.keyDown(header, { key: 'Enter' });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Entidad emisora')).toBeInTheDocument();

    fireEvent.keyDown(header, { key: 'Enter' });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Entidad emisora')).not.toBeInTheDocument();
  });
});
