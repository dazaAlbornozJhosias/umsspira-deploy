import { renderHook, act } from '@testing-library/react';
import { useAffinityCalculation } from './use-affinity-calculation';
import * as affinityService from '../services/affinity-service';

jest.mock('../services/affinity-service');

describe('useAffinityCalculation Hook', () => {
  const mockCalculateAffinityVector = affinityService.calculateAffinityVector as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inicia con estado por defecto (sin carga, sin error, sin datos)', () => {
    const { result } = renderHook(() => useAffinityCalculation());

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('maneja la carga exitosa del cálculo', async () => {
    const mockData = {
      graduateId: 'id-1',
      calculatedAt: '2026-09-29T12:00:00.000Z',
      areas: [{ area: 'software-development', affinity: 85 }],
    };

    mockCalculateAffinityVector.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useAffinityCalculation());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.calculate();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('maneja el estado de error y permite reintentar', async () => {
    const errorMsg = 'Error al conectar con la base de datos.';
    mockCalculateAffinityVector.mockRejectedValueOnce(new Error(errorMsg));

    const { result } = renderHook(() => useAffinityCalculation());

    await act(async () => {
      await result.current.calculate();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMsg);
    expect(result.current.data).toBeNull();

    // Reintento exitoso
    const successData = {
      graduateId: 'id-1',
      calculatedAt: '2026-09-29T12:00:00.000Z',
      areas: [{ area: 'cloud-devops', affinity: 90 }],
    };
    mockCalculateAffinityVector.mockResolvedValueOnce(successData);

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(successData);
  });
});
