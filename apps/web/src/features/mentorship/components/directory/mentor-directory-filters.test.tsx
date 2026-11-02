import { fireEvent, render, screen } from '@testing-library/react';
import { MentorDirectoryFilters } from './mentor-directory-filters';
import type { InterestArea } from '../../model/mentor-interests';

const TEST_CATALOG: InterestArea[] = [
  { id: 'software', name: 'Desarrollo de software', description: '', topics: [{ id: 'api', name: 'APIs REST' }, { id: 'web', name: 'Desarrollo web' }] },
  { id: 'cloud', name: 'Cloud/DevOps', description: '', topics: [{ id: 'docker', name: 'Docker y Kubernetes' }] },
  { id: 'data', name: 'Ciencia de Datos/IA', description: '', topics: [{ id: 'ml', name: 'Aprendizaje automático' }] },
  { id: 'qa', name: 'QA', description: '', topics: [{ id: 'automation', name: 'Pruebas automatizadas' }] },
  { id: 'security', name: 'Ciberseguridad', description: '', topics: [{ id: 'appsec', name: 'Seguridad de aplicaciones' }] },
  { id: 'it', name: 'Gestión TI', description: '', topics: [{ id: 'itil', name: 'ITIL y servicios TI' }] },
];

const empty = { areaIds: [], topicIds: [] };

beforeEach(() => jest.clearAllMocks());

it('muestra las seis áreas oficiales recibidas desde el catálogo', () => {
  render(<MentorDirectoryFilters catalog={TEST_CATALOG} applied={empty} interestsSupported disabled={false} onApply={jest.fn()} />);

  for (const area of TEST_CATALOG) {
    expect(screen.getByRole('checkbox', { name: area.name })).toBeInTheDocument();
  }
  expect(screen.getAllByRole('checkbox')).toHaveLength(6);
});

it('usa chips accesibles de selección múltiple para intereses, agrupados por área', () => {
  render(<MentorDirectoryFilters catalog={TEST_CATALOG} applied={empty} interestsSupported disabled={false} onApply={jest.fn()} />);

  const loadMore = screen.getByRole('button', { name: 'Cargar más intereses' });
  fireEvent.click(loadMore);
  const apiChip = screen.getByRole('button', { name: 'APIs REST' });
  const dockerChip = screen.getByRole('button', { name: 'Docker y Kubernetes' });
  expect(apiChip).toHaveAttribute('aria-pressed', 'false');
  expect(apiChip).toHaveProperty('tabIndex', 0);
  expect(screen.queryByRole('checkbox', { name: 'APIs REST' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Desarrollo de software' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Cloud/DevOps' })).toBeInTheDocument();

  fireEvent.click(apiChip);
  fireEvent.click(dockerChip);
  expect(apiChip).toHaveAttribute('aria-pressed', 'true');
  expect(dockerChip).toHaveAttribute('aria-pressed', 'true');
});

it('expande todos los intereses y oculta Cargar más cuando ya no quedan grupos', () => {
  render(<MentorDirectoryFilters catalog={TEST_CATALOG} applied={empty} interestsSupported disabled={false} onApply={jest.fn()} />);

  expect(screen.queryByRole('button', { name: 'ITIL y servicios TI' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cargar más intereses' }));
  expect(screen.getByRole('button', { name: 'ITIL y servicios TI' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cargar más intereses' })).not.toBeInTheDocument();
});

it('mantiene aplicar filtros y limpiar selección de áreas e intereses', () => {
  const onApply = jest.fn();
  const { rerender } = render(<MentorDirectoryFilters catalog={TEST_CATALOG} applied={empty} interestsSupported disabled={false} onApply={onApply} />);

  fireEvent.click(screen.getByRole('checkbox', { name: 'Desarrollo de software' }));
  const apiChip = screen.getByRole('button', { name: 'APIs REST' });
  fireEvent.click(apiChip);
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(onApply).toHaveBeenLastCalledWith({ areaIds: ['software'], topicIds: ['api'] });

  rerender(<MentorDirectoryFilters catalog={TEST_CATALOG} applied={{ areaIds: ['software'], topicIds: ['api'] }} interestsSupported disabled={false} onApply={onApply} />);
  expect(screen.getByRole('button', { name: 'APIs REST' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
  expect(onApply).toHaveBeenLastCalledWith(empty);
});

it('al quitar un área elimina sus intereses seleccionados', () => {
  render(<MentorDirectoryFilters catalog={TEST_CATALOG} applied={empty} interestsSupported disabled={false} onApply={jest.fn()} />);

  const software = screen.getByRole('checkbox', { name: 'Desarrollo de software' });
  fireEvent.click(software);
  fireEvent.click(screen.getByRole('button', { name: 'APIs REST' }));
  fireEvent.click(software);
  expect(screen.getByRole('button', { name: 'APIs REST' })).toHaveAttribute('aria-pressed', 'false');
});
