import { renderHook, act } from '@testing-library/react';
import { useRecalculateState } from './use-recalculate-state';

describe('useRecalculateState Hook', () => {
  it('inicia con hasPendingChanges en false', () => {
    const { result } = renderHook(() => useRecalculateState());
    expect(result.current.hasPendingChanges).toBe(false);
  });

  it('markPendingChanges activa hasPendingChanges', () => {
    const { result } = renderHook(() => useRecalculateState());

    act(() => {
      result.current.markPendingChanges();
    });

    expect(result.current.hasPendingChanges).toBe(true);
  });

  it('clearPendingChanges desactiva hasPendingChanges', () => {
    const { result } = renderHook(() => useRecalculateState());

    act(() => {
      result.current.markPendingChanges();
    });
    expect(result.current.hasPendingChanges).toBe(true);

    act(() => {
      result.current.clearPendingChanges();
    });
    expect(result.current.hasPendingChanges).toBe(false);
  });
});
