import { render, screen, within } from '@testing-library/react';
import { InfluentialKeywords } from './affinity-influential-keywords';

it('QA HU8-01: muestra puntos y peso diferentes por keyword junto a frecuencia y porcentaje reales', () => {
  render(<InfluentialKeywords keywords={[
    { keyword: 'arquitectura', frequency: 3, weight: 0.63, points: 1.89, percentage: 37.8 },
    { keyword: 'gestion', frequency: 2, weight: 0.4, points: 0.8, percentage: 16 },
  ]} />);
  const rows = screen.getAllByRole('listitem');
  expect(within(rows[0]).getByText('Freq: 3')).toBeInTheDocument();
  expect(within(rows[0]).getByText('Puntos: 1.89')).toBeInTheDocument();
  expect(within(rows[0]).getByText('Peso: 0.63')).toBeInTheDocument();
  expect(within(rows[0]).getByText('38%')).toBeInTheDocument();
  expect(within(rows[1]).getByText('Puntos: 0.8')).toBeInTheDocument();
  expect(within(rows[1]).getByText('Peso: 0.4')).toBeInTheDocument();
  expect(within(rows[1]).getByText('16%')).toBeInTheDocument();
});

it('no inventa puntos ni pesos cuando faltan y mantiene el limite de cinco keywords', () => {
  const keywords = Array.from({ length: 6 }, (_, i) => ({ keyword: `keyword-${i}`, frequency: 1, percentage: 7 }));
  render(<InfluentialKeywords keywords={keywords as Parameters<typeof InfluentialKeywords>[0]['keywords']} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(5);
  expect(screen.getAllByText('Puntos: —')).toHaveLength(5);
  expect(screen.getAllByText('Peso: —')).toHaveLength(5);
  expect(screen.queryByText('keyword-5')).not.toBeInTheDocument();
});
