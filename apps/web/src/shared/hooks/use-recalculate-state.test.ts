import { renderHook, act } from '@testing-library/react';
import {
  clearPendingProfileChanges,
  hasPendingProfileChanges,
  markPendingProfileChanges,
  useRecalculateState,
} from './use-recalculate-state';

describe('useRecalculateState Hook', () => {
  beforeEach(() => {
    clearPendingProfileChanges();
  });

  it('inicia con hasPendingChanges en false', () => {
    const { result } = renderHook(() => useRecalculateState());
    expect(result.current.hasPendingChanges).toBe(false);
  });

  it('inicia con hasPendingChanges en true si se registró una eliminación o cambio en el perfil', () => {
    markPendingProfileChanges();
    expect(hasPendingProfileChanges()).toBe(true);

    const { result } = renderHook(() => useRecalculateState());
    expect(result.current.hasPendingChanges).toBe(true);
  });

  it('markPendingChanges activa hasPendingChanges', () => {
    const { result } = renderHook(() => useRecalculateState());

    act(() => {
      result.current.markPendingChanges();
    });

    expect(result.current.hasPendingChanges).toBe(true);
  });

  it('clearPendingChanges desactiva hasPendingChanges y limpia el estado persistido', () => {
    markPendingProfileChanges();
    const { result } = renderHook(() => useRecalculateState());
    expect(result.current.hasPendingChanges).toBe(true);

    act(() => {
      result.current.clearPendingChanges();
    });
    expect(result.current.hasPendingChanges).toBe(false);
    expect(hasPendingProfileChanges()).toBe(false);
  });
});