import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AFFINITY_AREAS } from '@umsspira/shared-types';
import { GraduateAffinityView } from './graduate-affinity-view';
import { getAffinityVector, recalculateAffinity } from '../services/affinity-service';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('./affinity-radar', () => ({
  __esModule: true,
  default: ({ onSelectArea }: { onSelectArea: (id: string) => void }) =>
    <button onClick={() => onSelectArea('software-development')}>Inspeccionar software</button>,
}));
jest.mock('../services/affinity-service', () => ({
  ...jest.requireActual('../services/affinity-service'),
  getAffinityVector: jest.fn(),
  recalculateAffinity: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (getAffinityVector as jest.Mock).mockResolvedValue({
    graduateId: 'validation-only',
    calculatedAt: '2026-10-29T12:00:00.000Z',
    hasLaborHistory: true,
    hasPendingChanges: false,
    status: 'ok',
    areas: AFFINITY_AREAS.map(area => ({
      area, affinity: area === 'software-development' ? 25 : 0,
      previousAffinity: null, weighting: 5,
      topKeywords: area === 'software-development'
        ? [{ keyword: 'keyword-real-hu8', weight: 5, frequency: 2, points: 10, percentage: 25 }]
        : [],
    })),
  });
});

it('HU8: muestra los aportes reales recibidos por el servicio en la inspección', async () => {
  render(<GraduateAffinityView />);
  fireEvent.click(await screen.findByRole('button', { name: 'Inspeccionar software' }));
  const panel = screen.getByText('Palabras clave más influyentes').parentElement!;
  expect(within(panel).getByText('keyword-real-hu8')).toBeInTheDocument();
  expect(within(panel).getByText('Freq: 2')).toBeInTheDocument();
  expect(within(panel).getByText('25%')).toBeInTheDocument();
});

it('HU7: no atribuye una certificación del mock a un perfil que no la devolvió', async () => {
  render(<GraduateAffinityView />);
  fireEvent.click(await screen.findByRole('button', { name: 'Inspeccionar software' }));
  expect(screen.queryByText('Certificación Avanzada de React')).not.toBeInTheDocument();
});

it('HU7: informa la falta de historial aunque existan aportes de certificaciones', async () => {
  const vector = await getAffinityVector();
  (getAffinityVector as jest.Mock).mockResolvedValueOnce({ ...vector, hasLaborHistory: false });
  render(<GraduateAffinityView />);
  await screen.findByRole('button', { name: 'Inspeccionar software' });
  expect(screen.getByText('Sin datos de historial laboral')).toBeInTheDocument();
});

it('actualiza los aportes y el indicador de historial después de recalcular', async () => {
  const vector = await getAffinityVector();
  (getAffinityVector as jest.Mock).mockResolvedValueOnce({ ...vector, hasPendingChanges: true });
  (recalculateAffinity as jest.Mock).mockResolvedValueOnce({
    ...vector, hasLaborHistory: false, recalculated: true,
    areas: vector.areas.map(area => ({
      ...area,
      topKeywords: area.area === 'software-development'
        ? [{ keyword: 'nuevo-aporte', weight: 5, frequency: 1, points: 5, percentage: 12.5 }]
        : [],
    })),
  });
  render(<GraduateAffinityView />);
  fireEvent.click(await screen.findByRole('button', { name: 'Inspeccionar software' }));
  expect(screen.queryByText('Sin datos de historial laboral')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Recalcular' }));
  await screen.findByText('Radar actualizado');
  const panel = screen.getByText('Palabras clave más influyentes').parentElement!;
  expect(within(panel).getByText('nuevo-aporte')).toBeInTheDocument();
  expect(within(panel).queryByText('keyword-real-hu8')).not.toBeInTheDocument();
  expect(screen.getByText('Sin datos de historial laboral')).toBeInTheDocument();
});
